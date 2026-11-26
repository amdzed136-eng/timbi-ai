import Anthropic from '@anthropic-ai/sdk';
import type { BetaContentBlockParam, BetaMessageParam, BetaTool, BetaToolResultBlockParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { newId, now, parseRow, type DB } from './db.ts';
import { audit } from './audit.ts';
import { assertCanSpend, assertKnownModel, BudgetExceededError, recordCall, PRICING } from './budget.ts';
import { assertRunning, EmergencyStopError, recordFailure, recordSuccess } from './state.ts';
import type { LlmClient } from './llm.ts';
import { rosterEntry } from '../agents/roster.ts';
import { AGENT_PROFILES } from '../agents/prompts.ts';
import { createTask, toolsFor, type ToolContext } from '../tools/index.ts';
import type { Config } from '../config.ts';
import type { Notifier } from '../telegram/notifier.ts';

export interface Deps { db: DB; cfg: Config; llm: LlmClient; notifier: Notifier }

export interface TaskRow {
  id: string; agent_id: string; title: string; input: { brief: string }; status: string;
  attempts: number; max_attempts: number; parent_task_id: string | null; result: unknown; error: string | null;
}

export function getTask(db: DB, id: string): TaskRow | undefined {
  const r = db.prepare('select * from tasks where id = ?').get(id);
  return r ? parseRow<TaskRow>(r, ['input', 'result']) : undefined;
}

/** Erreurs qui méritent une nouvelle tentative de la tâche (réseau, surcharge). */
function isRetryable(e: unknown): boolean {
  if (e instanceof BudgetExceededError || e instanceof EmergencyStopError) return false;
  if (e instanceof Anthropic.RateLimitError) return true;
  if (e instanceof Anthropic.InternalServerError) return true;
  if (e instanceof Anthropic.APIConnectionError) return true;
  if (e instanceof Anthropic.APIError) return false; // 4xx : requête invalide, inutile de réessayer
  return false;
}

class AgentFailure extends Error {
  constructor(msg: string) { super(msg); this.name = 'AgentFailure'; }
}

/**
 * Exécute une tâche : boucle d'agent avec, à CHAQUE itération, contrôle de l'arrêt d'urgence,
 * du budget, des permissions d'outils, et journalisation complète.
 */
export async function runTask(deps: Deps, taskId: string, depth = 0): Promise<TaskRow> {
  const { db, cfg, llm, notifier } = deps;
  const task = getTask(db, taskId);
  if (!task) throw new Error(`Tâche introuvable : ${taskId}`);
  const agent = rosterEntry(task.agent_id);
  const profile = AGENT_PROFILES[task.agent_id];
  if (!agent || agent.status !== 'active' || !profile) throw new Error(`Agent inactif ou inconnu : ${task.agent_id}`);

  const model = cfg.models[agent.id] ?? 'claude-opus-5-5';
  const runId = newId();
  db.prepare("update tasks set status = 'running', attempts = attempts + 1, updated_at = ? where id = ?").run(now(), taskId);
  db.prepare("insert into runs (id, task_id, agent_id, status, started_at) values (?, ?, ?, 'running', ?)").run(runId, taskId, agent.id, now());
  audit(db, agent.id, 'run.started', runId, { taskId, model, attempt: task.attempts + 1 });

  const tools = toolsFor(agent.tools);
  const apiTools: BetaTool[] = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema, strict: true }));
  const messages: BetaMessageParam[] = [{ role: 'user', content: task.input.brief }];

  const ctx: ToolContext = {
    db, cfg, notifier, agentId: agent.id, taskId, runId, depth,
    runSubtask: async (subAgentId, brief) => {
      const subId = createTask(db, cfg, { agentId: subAgentId, title: brief.slice(0, 120), brief, createdBy: agent.id, parentTaskId: taskId });
      const sub = await runTask(deps, subId, depth + 1);
      return { status: sub.status, summary: typeof sub.result === 'object' && sub.result ? String((sub.result as { summary?: string }).summary ?? '') : String(sub.error ?? '') };
    },
  };

  let iterations = 0;
  try {
    assertKnownModel(cfg.llmMode === 'mock' ? 'mock-model' : model);
    while (true) {
      if (++iterations > cfg.limits.maxIterations) throw new AgentFailure(`Limite de ${cfg.limits.maxIterations} itérations atteinte`);
      assertRunning(db, cfg);
      assertCanSpend(db, cfg, runId);

      const res = await llm.create({
        agentId: agent.id, model, system: profile.system, tools: apiTools, messages,
        maxTokens: cfg.limits.maxOutputTokens, effort: profile.effort,
      });
      // En cas de repli serveur, on facture au plus cher des deux tarifs (prudence).
      const billModel = PRICING[res.model] && (!PRICING[model] || PRICING[res.model].output >= PRICING[model].output) ? res.model : model;
      const cost = recordCall(db, { runId, agentId: agent.id, model: billModel, usage: res.usage });
      db.prepare('update runs set iterations = ? where id = ?').run(iterations, runId);
      audit(db, agent.id, 'llm.call', runId, { model: res.model, stop: res.stop_reason, in: res.usage.input_tokens, out: res.usage.output_tokens, cost_usd: +cost.toFixed(5) });

      // Le contenu complet (y compris les blocs de réflexion) est renvoyé tel quel au tour suivant.
      messages.push({ role: 'assistant', content: res.content as BetaContentBlockParam[] });

      if (res.stop_reason === 'refusal') throw new AgentFailure('Le modèle a refusé la requête (même après repli).');
      if (res.stop_reason === 'max_tokens') throw new AgentFailure('Réponse tronquée (max_tokens).');
      if (res.stop_reason === 'pause_turn') continue;
      if (res.stop_reason !== 'tool_use') {
        const summary = res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n').trim();
        finish(db, taskId, runId, 'done', { summary }, null);
        audit(db, agent.id, 'run.done', runId, { iterations });
        recordSuccess(db);
        return getTask(db, taskId)!;
      }

      // Exécute tous les appels d'outils du tour et renvoie TOUS les résultats dans un seul message.
      const results: BetaToolResultBlockParam[] = [];
      for (const block of res.content) {
        if (block.type !== 'tool_use') continue;
        const t = tools.find((x) => x.name === block.name);
        let content: string;
        let isError = false;
        if (!t || !agent.tools.includes(block.name)) {
          // Défense en profondeur : outil hors liste blanche => refus, même si le modèle l'invente.
          isError = true;
          content = `Permission refusée : ${agent.name} n'a pas accès à l'outil ${block.name}.`;
          audit(db, agent.id, 'tool.denied', block.name);
        } else {
          try {
            assertRunning(db, cfg);
            const out = await t.run(block.input, ctx);
            content = JSON.stringify(out ?? null).slice(0, 20_000);
            audit(db, agent.id, 'tool.call', block.name, { input: block.input });
          } catch (e) {
            if (e instanceof EmergencyStopError) throw e;
            isError = true;
            content = `Erreur : ${e instanceof Error ? e.message : String(e)}`;
            audit(db, agent.id, 'tool.error', block.name, { error: content });
          }
        }
        results.push({ type: 'tool_result', tool_use_id: block.id, content, is_error: isError });
      }
      messages.push({ role: 'user', content: results });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const fresh = getTask(db, taskId)!;
    const retry = isRetryable(e) && fresh.attempts < fresh.max_attempts;
    db.prepare("update runs set status = 'failed', ended_at = ?, error = ? where id = ?").run(now(), msg, runId);
    if (retry) {
      const delayMs = 30_000 * 2 ** (fresh.attempts - 1); // 30 s, 60 s, 120 s…
      db.prepare("update tasks set status = 'queued', error = ?, next_attempt_at = ?, updated_at = ? where id = ?")
        .run(msg, new Date(Date.now() + delayMs).toISOString(), now(), taskId);
      audit(db, agent.id, 'task.retry_scheduled', taskId, { error: msg, delayMs });
    } else {
      finish(db, taskId, runId, 'failed', null, msg);
      audit(db, agent.id, 'task.failed', taskId, { error: msg });
      if (!(e instanceof EmergencyStopError)) {
        const tripped = recordFailure(db, cfg);
        await notifier.notifyOwner(`⚠️ ${agent.name} — tâche échouée : ${task.title}\n${msg}${tripped ? "\n🛑 Disjoncteur déclenché : arrêt d'urgence actif." : ''}`).catch(() => {});
      }
    }
    return getTask(db, taskId)!;
  }
}

function finish(db: DB, taskId: string, runId: string, status: 'done' | 'failed', result: unknown, error: string | null) {
  db.prepare('update tasks set status = ?, result = ?, error = ?, updated_at = ? where id = ?')
    .run(status, result ? JSON.stringify(result) : null, error, now(), taskId);
  db.prepare('update runs set status = ?, ended_at = ?, error = ? where id = ?').run(status, now(), error, runId);
}

/** Traite la prochaine tâche prête de la file (une à la fois, pour garder le contrôle des coûts). */
export async function processNextTask(deps: Deps): Promise<TaskRow | null> {
  const r = deps.db.prepare("select id from tasks where status = 'queued' and next_attempt_at <= ? order by created_at limit 1")
    .get(now()) as { id: string } | undefined;
  return r ? runTask(deps, r.id) : null;
}
