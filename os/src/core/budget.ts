import { newId, now, type DB } from './db.ts';
import type { Config } from '../config.ts';

/** USD par million de tokens. Un modèle absent de cette table est refusé (impossible à budgéter). */
export const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  'claude-opus-5-5':   { input: 4,    output: 20,   cacheRead: 0.2,  cacheWrite: 5 },
  'claude-sonnet-5-5': { input: 2,    output: 10,   cacheRead: 0.1,  cacheWrite: 2.5 },
  'claude-haiku-5-5':  { input: 0.1,  output: 0.5,  cacheRead: 0.01, cacheWrite: 0.125 },
  'claude-opus-5':     { input: 5,    output: 25,   cacheRead: 0.5,  cacheWrite: 6.25 },
  'claude-opus-4-8':   { input: 5,    output: 25,   cacheRead: 0.5,  cacheWrite: 6.25 },
  'mock-model':        { input: 4,    output: 20,   cacheRead: 0.2,  cacheWrite: 5 },
};

export class BudgetExceededError extends Error {
  constructor(msg: string) { super(msg); this.name = 'BudgetExceededError'; }
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export function assertKnownModel(model: string) {
  if (!PRICING[model]) throw new BudgetExceededError(`Modèle sans tarif connu, refusé : ${model}`);
}

export function costOf(model: string, u: Usage): number {
  const p = PRICING[model];
  if (!p) throw new BudgetExceededError(`Modèle sans tarif connu : ${model}`);
  return (
    u.input_tokens * p.input +
    u.output_tokens * p.output +
    (u.cache_read_input_tokens ?? 0) * p.cacheRead +
    (u.cache_creation_input_tokens ?? 0) * p.cacheWrite
  ) / 1_000_000;
}

/** Début du jour / du mois à Istanbul (UTC+3 toute l'année, pas d'heure d'été depuis 2016). */
function istanbulStart(unit: 'day' | 'month', at = new Date()): string {
  const local = new Date(at.getTime() + 3 * 3600_000);
  const y = local.getUTCFullYear(), m = local.getUTCMonth(), d = unit === 'day' ? local.getUTCDate() : 1;
  return new Date(Date.UTC(y, m, d) - 3 * 3600_000).toISOString();
}

/** Les coûts simulés (mock-model) et réels sont comptés séparément : simuler ne consomme pas le budget réel. */
function modelFilter(cfg: Config) {
  return cfg.llmMode === 'mock' ? "model = 'mock-model'" : "model != 'mock-model'";
}

function sumSince(db: DB, cfg: Config, since: string): number {
  const r = db.prepare(`select coalesce(sum(cost_usd), 0) as s from llm_calls where created_at >= ? and ${modelFilter(cfg)}`).get(since) as { s: number };
  return r.s;
}

export function spending(db: DB, cfg: Config, runId?: string) {
  const run = runId
    ? (db.prepare('select coalesce(sum(cost_usd), 0) as s from llm_calls where run_id = ?').get(runId) as { s: number }).s
    : 0;
  return { run, today: sumSince(db, cfg, istanbulStart('day')), month: sumSince(db, cfg, istanbulStart('month')) };
}

/** Vérifie AVANT chaque appel qu'il reste au moins la réserve sous chaque plafond. */
export function assertCanSpend(db: DB, cfg: Config, runId: string) {
  const s = spending(db, cfg, runId);
  const { perRunUsd, dailyUsd, monthlyUsd, reserveUsd } = cfg.budget;
  if (s.run + reserveUsd > perRunUsd) throw new BudgetExceededError(`Plafond par exécution atteint (${s.run.toFixed(3)} $ / ${perRunUsd} $)`);
  if (s.today + reserveUsd > dailyUsd) throw new BudgetExceededError(`Plafond journalier atteint (${s.today.toFixed(3)} $ / ${dailyUsd} $)`);
  if (s.month + reserveUsd > monthlyUsd) throw new BudgetExceededError(`Plafond mensuel atteint (${s.month.toFixed(3)} $ / ${monthlyUsd} $)`);
}

export function recordCall(db: DB, p: { runId: string; agentId: string; model: string; usage: Usage }): number {
  const cost = costOf(p.model, p.usage);
  db.prepare(`insert into llm_calls (id, run_id, agent_id, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, created_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    newId(), p.runId, p.agentId, p.model, p.usage.input_tokens, p.usage.output_tokens,
    p.usage.cache_read_input_tokens ?? 0, p.usage.cache_creation_input_tokens ?? 0, cost, now(),
  );
  db.prepare('update runs set cost_usd = cost_usd + ? where id = ?').run(cost, p.runId);
  return cost;
}
