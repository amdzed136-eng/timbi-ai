import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaContentBlock, BetaMessageParam, BetaStopReason, BetaTool, BetaToolUseBlock,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type { Config } from '../config.ts';
import type { Usage } from './budget.ts';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface LlmRequest {
  agentId: string;
  model: string;
  system: string;
  tools: BetaTool[];
  messages: BetaMessageParam[];
  maxTokens: number;
  effort: Effort;
}

export interface LlmResponse {
  content: BetaContentBlock[];
  stop_reason: BetaStopReason | null;
  usage: Usage;
  /** Modèle réellement servi (peut différer en cas de repli serveur). */
  model: string;
}

export interface LlmClient {
  create(req: LlmRequest): Promise<LlmResponse>;
}

/** Vraie API Claude. Les clés sont lues par le SDK depuis l'environnement, jamais depuis le code. */
export class AnthropicLlm implements LlmClient {
  private client: Anthropic;
  constructor() {
    // maxRetries : 2 nouvelles tentatives réseau automatiques (429, 5xx, coupures), puis l'erreur remonte au runner.
    this.client = new Anthropic({ maxRetries: 2, timeout: 120_000 });
  }

  async create(req: LlmRequest): Promise<LlmResponse> {
    const res = await this.client.beta.messages.create({
      model: req.model,
      max_tokens: req.maxTokens,
      // Prompt système stable + outils déterministes => mis en cache (coût ÷10 sur cette partie).
      system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
      tools: req.tools,
      messages: req.messages,
      output_config: { effort: req.effort },
      // Si le modèle refuse une requête, l'API la rejoue sur un modèle de repli adapté.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    return { content: res.content, stop_reason: res.stop_reason, usage: res.usage, model: res.model };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM simulé : scénarios déterministes, gratuits, hors-ligne. Sert aux tests et à la
// démonstration du flux complet sans clé API. Les coûts simulés sont comptés sous
// le modèle `mock-model` pour exercer la logique de budget.
// ─────────────────────────────────────────────────────────────────────────────

type ToolResults = Array<{ name: string; result: any }>;
type Step = (brief: string, lastResults: ToolResults, all: ToolResults) => Array<{ name: string; input: Record<string, unknown> }> | string;

let mockSeq = 0;
const toolUse = (name: string, input: Record<string, unknown>): BetaToolUseBlock =>
  ({ type: 'tool_use', id: `toolu_mock_${++mockSeq}`, name, input, caller: { type: 'direct' } }) as unknown as BetaToolUseBlock;

const HUNTER_SCRIPT: Step[] = [
  (brief) => [
    { name: 'memory_read', input: { scope: 'global', key: 'icp' } },
    { name: 'search_companies', input: { query: brief, sector: /café|cafe|restaurant/i.test(brief) ? 'restaurant' : '', city: 'Istanbul', max_results: 6 } },
  ],
  (_b, last) => {
    const found = last.find((r) => r.name === 'search_companies')?.result?.companies ?? [];
    return found.slice(0, 4).map((c: { id: string }) => ({ name: 'score_lead', input: { company_id: c.id } }));
  },
  (_b, last) => last
    .filter((r) => r.name === 'score_lead' && r.result?.score >= 60)
    .map((r) => ({ name: 'save_lead', input: { company_id: r.result.company_id, score: r.result.score, rationale: r.result.reasons.join(' ; ') } })),
  (_b, _last, all) => {
    const best = all.filter((r) => r.name === 'score_lead').sort((a, b) => b.result.score - a.result.score)[0];
    const saved = all.find((r) => r.name === 'save_lead' && r.result?.company === best?.result?.company);
    if (!best || !saved) return 'Aucun prospect assez qualifié aujourd\'hui.';
    return [{ name: 'request_outreach_approval', input: {
      lead_id: saved.result.lead_id, channel: 'email',
      message_draft: `Bonjour, je suis l'équipe TIMBI AI à Istanbul. Nous avons remarqué que ${best.result.company} a d'excellents avis mais pas encore de site moderne. Nous serions ravis de vous montrer une maquette gratuite. Bonne journée !`,
    } }];
  },
  (_b, _l, all) => {
    const saved = all.filter((r) => r.name === 'save_lead').map((r) => r.result.company);
    return `Recherche terminée. ${saved.length} prospect(s) qualifié(s) : ${saved.join(', ')}. Une demande d'approbation de premier contact est en attente.`;
  },
];

const ATLAS_SCRIPT: Step[] = [
  () => [{ name: 'get_system_status', input: {} }],
  (brief) => [{ name: 'delegate_to_agent', input: { agent_id: 'hunter', brief: `Objectif d'ATLAS : ${brief}. Trouve et qualifie 3 prospects à Istanbul.` } }],
  (_b, last) => [{ name: 'notify_owner', input: { message: `Brief ATLAS : ${String(last[0]?.result?.summary ?? 'délégation terminée')}` } }],
  () => 'Objectif traité : prospection déléguée à HUNTER, propriétaire informé.',
];

export class MockLlm implements LlmClient {
  calls = 0;
  async create(req: LlmRequest): Promise<LlmResponse> {
    this.calls++;
    const script = req.agentId === 'hunter' ? HUNTER_SCRIPT : ATLAS_SCRIPT;
    const firstUser = req.messages[0]?.content;
    const brief = typeof firstUser === 'string' ? firstUser : '';

    // Reconstitue les résultats d'outils déjà reçus (nom retrouvé via l'id du tool_use).
    const names = new Map<string, string>();
    const turns: ToolResults[] = [];
    for (const m of req.messages) {
      if (typeof m.content === 'string') continue;
      const results: ToolResults = [];
      for (const b of m.content as Array<any>) {
        if (b.type === 'tool_use') names.set(b.id, b.name);
        if (b.type === 'tool_result') {
          let parsed: unknown = b.content;
          try { parsed = JSON.parse(String(b.content)); } catch { /* texte brut */ }
          results.push({ name: names.get(b.tool_use_id) ?? '?', result: parsed });
        }
      }
      if (results.length) turns.push(results);
    }
    const step = script[Math.min(turns.length, script.length - 1)];
    const out = step(brief, turns.at(-1) ?? [], turns.flat());
    const usage = { input_tokens: 1200 + 500 * turns.length, output_tokens: 350, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

    if (typeof out === 'string' || out.length === 0) {
      return { content: [{ type: 'text', text: typeof out === 'string' ? out : 'Terminé.', citations: null } as BetaContentBlock], stop_reason: 'end_turn', usage, model: 'mock-model' };
    }
    return { content: out.map((t) => toolUse(t.name, t.input)), stop_reason: 'tool_use', usage, model: 'mock-model' };
  }
}

export function makeLlm(cfg: Config): LlmClient {
  return cfg.llmMode === 'live' ? new AnthropicLlm() : new MockLlm();
}
