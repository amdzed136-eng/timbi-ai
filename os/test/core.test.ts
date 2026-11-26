import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.ts';
import { openDb } from '../src/core/db.ts';
import { MockLlm, type LlmClient } from '../src/core/llm.ts';
import { MockNotifier } from '../src/telegram/notifier.ts';
import { runTask, type Deps } from '../src/core/runner.ts';
import { createTask } from '../src/tools/index.ts';
import { decide, listApprovals, requestApproval } from '../src/core/approvals.ts';
import { audit, verifyAudit } from '../src/core/audit.ts';
import { emergencyStop } from '../src/core/state.ts';
import { recordCall } from '../src/core/budget.ts';
import { OwnerBot } from '../src/telegram/bot.ts';

function setup(env: Record<string, string> = {}, llm?: LlmClient) {
  const dir = mkdtempSync(path.join(tmpdir(), 'timbi-'));
  const cfg = loadConfig({ DB_PATH: ':memory:', ...env });
  cfg.stopFile = path.join(dir, 'STOP');
  const notifier = new MockNotifier(null);
  const deps: Deps = { db: openDb(':memory:'), cfg, llm: llm ?? new MockLlm(), notifier };
  return { deps, notifier, dir };
}

const hunt = (deps: Deps, brief = 'Restaurants à Istanbul') =>
  runTask(deps, createTask(deps.db, deps.cfg, { agentId: 'hunter', title: brief, brief, createdBy: 'test' }));

test('le mode production est verrouillé', () => {
  assert.throws(() => loadConfig({ TIMBI_MODE: 'production' }), /verrouillé/);
});

test('HUNTER : qualifie des prospects et crée UNE approbation sans rien envoyer', async () => {
  const { deps, notifier } = setup();
  const t = await hunt(deps);
  assert.equal(t.status, 'done', t.error ?? '');
  const leads = deps.db.prepare('select * from leads').all() as Array<{ score: number; is_fictitious: number }>;
  assert.ok(leads.length >= 2);
  assert.ok(leads.every((l) => l.score >= 60 && l.is_fictitious === 1));
  const pending = listApprovals(deps.db, 'pending');
  assert.equal(pending.length, 1);
  assert.equal(pending[0].action_type, 'outreach.send');
  assert.ok(notifier.sent.some((m) => m.includes('Approbation requise')));
  const cost = deps.db.prepare('select sum(cost_usd) as c from llm_calls').get() as { c: number };
  assert.ok(cost.c > 0);
});

test("ATLAS délègue à HUNTER et notifie le propriétaire", async () => {
  const { deps, notifier } = setup();
  const t = await runTask(deps, createTask(deps.db, deps.cfg, { agentId: 'atlas', title: 'obj', brief: 'Prospection restaurants', createdBy: 'test' }));
  assert.equal(t.status, 'done', t.error ?? '');
  const sub = deps.db.prepare("select * from tasks where agent_id = 'hunter'").get() as { parent_task_id: string; status: string };
  assert.equal(sub.parent_task_id, t.id);
  assert.equal(sub.status, 'done');
  assert.ok(notifier.sent.some((m) => m.startsWith('📣 [ATLAS]')));
});

test("approbation : l'exécution est simulée en bac à sable et une double décision est refusée", async () => {
  const { deps } = setup();
  await hunt(deps);
  const [a] = listApprovals(deps.db, 'pending');
  const done = await decide(deps.db, deps.cfg, a.id, 'approved', 'owner', 'test');
  assert.equal(done.status, 'executed');
  assert.equal((done.result as { simulated: boolean }).simulated, true);
  await assert.rejects(decide(deps.db, deps.cfg, a.id, 'rejected', 'owner', 'test'), /déjà traitée/);
});

test("anti-doublon : deux missions n'ouvrent qu'une demande de contact par prospect", async () => {
  const { deps } = setup();
  await hunt(deps);
  await hunt(deps);
  assert.equal(listApprovals(deps.db, 'pending').length, 1);
});

test("request_outreach_approval accepte aussi l'identifiant d'entreprise", async () => {
  const { deps } = setup();
  const { TOOLS } = await import('../src/tools/index.ts');
  const ctx = { ...deps, agentId: 'hunter', taskId: 't', runId: 'r', depth: 0, runSubtask: async () => ({ status: '', summary: '' }) };
  await TOOLS.save_lead.run({ company_id: 'fx-005', score: 73, rationale: 'x' }, ctx);
  const r = await TOOLS.request_outreach_approval.run({ lead_id: 'fx-005', channel: 'email', message_draft: 'Bonjour' }, ctx) as { status: string };
  assert.equal(r.status, 'pending');
});

test('contrats et paiements sont interdits aux agents', async () => {
  const { deps } = setup();
  for (const actionType of ['contract.sign', 'payment.make']) {
    await assert.rejects(requestApproval(deps.db, deps.cfg, deps.notifier, { actionType, payload: {}, summary: 'x', requestedBy: 'atlas' }), /interdite/);
  }
});

test("arrêt d'urgence : aucune exécution, y compris via le fichier STOP", async () => {
  const { deps, dir } = setup();
  emergencyStop(deps.db, 'test', 'essai');
  const llm = deps.llm as MockLlm;
  const t = await hunt(deps);
  assert.equal(t.status, 'failed');
  assert.match(t.error ?? '', /Arrêt d'urgence/);
  assert.equal(llm.calls, 0);

  const { deps: d2 } = setup();
  d2.cfg.stopFile = path.join(dir, 'STOP');
  writeFileSync(d2.cfg.stopFile, '');
  const t2 = await hunt(d2);
  assert.match(t2.error ?? '', /fichier STOP/);
  rmSync(dir, { recursive: true, force: true });
});

test('budget : le plafond journalier bloque avant tout appel au modèle', async () => {
  const { deps } = setup({ BUDGET_DAILY_USD: '1' });
  recordCall(deps.db, { runId: 'x', agentId: 'hunter', model: 'mock-model', usage: { input_tokens: 0, output_tokens: 47_000 } }); // 0,94 $
  const t = await hunt(deps);
  assert.equal(t.status, 'failed');
  assert.match(t.error ?? '', /Plafond journalier/);
  assert.equal((deps.llm as MockLlm).calls, 0);
});

test('budget : le plafond par exécution interrompt une boucle coûteuse', async () => {
  const { deps } = setup({ BUDGET_PER_RUN_USD: '0.13', BUDGET_RESERVE_USD: '0.1' });
  const t = await hunt(deps);
  assert.equal(t.status, 'failed');
  assert.match(t.error ?? '', /Plafond par exécution/);
});

test('permissions : un outil hors liste blanche est refusé et journalisé', async () => {
  let n = 0;
  const rogue: LlmClient = {
    async create() {
      n++;
      const usage = { input_tokens: 10, output_tokens: 10 };
      if (n === 1) return { content: [{ type: 'tool_use', id: 't1', name: 'delegate_to_agent', input: { agent_id: 'hunter', brief: 'x' } }] as any, stop_reason: 'tool_use', usage, model: 'mock-model' };
      return { content: [{ type: 'text', text: 'fin' }] as any, stop_reason: 'end_turn', usage, model: 'mock-model' };
    },
  };
  const { deps } = setup({}, rogue);
  await hunt(deps);
  const denied = deps.db.prepare("select * from audit_log where action = 'tool.denied'").all();
  assert.equal(denied.length, 1);
  assert.equal(deps.db.prepare("select count(*) as n from tasks where agent_id = 'hunter'").get()!.n, 1);
});

test('retries : erreur non récupérable => échec, et le disjoncteur se déclenche', async () => {
  const failing: LlmClient = { async create() { throw new Error('boom'); } };
  const { deps, notifier } = setup({ CIRCUIT_BREAKER_ERRORS: '2' }, failing);
  await hunt(deps);
  await hunt(deps);
  const stop = deps.db.prepare("select value from system_state where key = 'emergency_stop'").get() as { value: string };
  assert.match(stop.value, /disjoncteur/);
  assert.ok(notifier.sent.some((m) => m.includes('Disjoncteur')));
});

test("audit : ajout seul et détection d'altération", () => {
  const { deps } = setup();
  audit(deps.db, 'test', 'a', null, { api_key: 'sk-secret', ok: 1 });
  audit(deps.db, 'test', 'b');
  assert.throws(() => deps.db.prepare("update audit_log set actor = 'x'").run(), /ajout seul/);
  assert.throws(() => deps.db.prepare('delete from audit_log').run(), /ajout seul/);
  const row = deps.db.prepare("select details from audit_log where action = 'a'").get() as { details: string };
  assert.ok(!row.details.includes('sk-secret'));
  assert.equal(verifyAudit(deps.db).ok, true);
  deps.db.exec('drop trigger audit_no_update');
  deps.db.prepare("update audit_log set actor = 'pirate' where action = 'a'").run();
  assert.equal(verifyAudit(deps.db).ok, false);
});

test("Telegram : seul le propriétaire peut approuver ou stopper", async () => {
  const { deps } = setup({ TELEGRAM_MODE: 'live', TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_OWNER_CHAT_ID: '111' });
  deps.notifier = new MockNotifier(null);
  await hunt(deps);
  const [a] = listApprovals(deps.db, 'pending');
  const calls: string[] = [];
  const bot = new OwnerBot(deps);
  (bot as any).api = { call: async (method: string) => { calls.push(method); return {}; } };

  await bot.handle({ update_id: 1, callback_query: { id: 'q', from: { id: 999 }, data: `apv:${a.id}` } });
  assert.equal(listApprovals(deps.db, 'pending').length, 1, 'un inconnu ne peut pas approuver');
  await bot.handle({ update_id: 2, message: { chat: { id: 999 }, from: { id: 999 }, text: '/stop' } });
  assert.equal(deps.db.prepare("select count(*) as n from system_state where key = 'emergency_stop'").get()!.n, 0);

  await bot.handle({ update_id: 3, callback_query: { id: 'q', from: { id: 111 }, data: `apv:${a.id}` } });
  assert.equal((deps.db.prepare('select status from approvals where id = ?').get(a.id) as { status: string }).status, 'executed');
  await bot.handle({ update_id: 4, message: { chat: { id: 111 }, from: { id: 111 }, text: '/stop' } });
  assert.equal(deps.db.prepare("select count(*) as n from system_state where key = 'emergency_stop'").get()!.n, 1);
  assert.ok(calls.includes('answerCallbackQuery'));
});
