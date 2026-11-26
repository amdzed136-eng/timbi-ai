import { newId, now, parseRow, type DB } from './db.ts';
import { audit } from './audit.ts';
import type { Config } from '../config.ts';
import type { Notifier } from '../telegram/notifier.ts';

/**
 * Politique des actions sensibles. Tout ce qui sort de TIMBI OS passe ici.
 * - approval : exécutable seulement après décision humaine explicite
 * - forbidden : aucun agent ne peut même le demander (contrats, paiements)
 */
export const ACTION_POLICY: Record<string, { level: 'approval' | 'forbidden'; label: string }> = {
  'outreach.send':          { level: 'approval',  label: 'Envoyer un premier message à un prospect' },
  'website.publish':        { level: 'approval',  label: 'Publier un site en production' },
  'client.read_sensitive':  { level: 'approval',  label: 'Accéder à des données client sensibles' },
  'contract.sign':          { level: 'forbidden', label: 'Signer un contrat' },
  'payment.make':           { level: 'forbidden', label: 'Effectuer un paiement' },
};

export interface ApprovalRow {
  id: string; action_type: string; payload: Record<string, unknown>; summary: string; requested_by: string;
  task_id: string | null; status: string; decided_by: string | null; decided_at: string | null;
  channel: string | null; result: unknown; expires_at: string; created_at: string;
}

const JSON_COLS = ['payload', 'result'];

export function getApproval(db: DB, id: string): ApprovalRow | undefined {
  const r = db.prepare('select * from approvals where id = ?').get(id);
  return r ? parseRow<ApprovalRow>(r, JSON_COLS) : undefined;
}

export function listApprovals(db: DB, status?: string): ApprovalRow[] {
  const rows = status
    ? db.prepare('select * from approvals where status = ? order by created_at desc').all(status)
    : db.prepare('select * from approvals order by created_at desc limit 50').all();
  return rows.map((r) => parseRow<ApprovalRow>(r, JSON_COLS));
}

export async function requestApproval(
  db: DB, cfg: Config, notifier: Notifier,
  p: { actionType: string; payload: Record<string, unknown>; summary: string; requestedBy: string; taskId?: string | null },
): Promise<ApprovalRow> {
  const policy = ACTION_POLICY[p.actionType];
  if (!policy) throw new Error(`Action inconnue de la politique : ${p.actionType}`);
  if (policy.level === 'forbidden') {
    audit(db, p.requestedBy, 'approval.blocked_forbidden', p.actionType, { summary: p.summary });
    throw new Error(`Action interdite aux agents : ${policy.label}. Seul un humain peut la réaliser, hors TIMBI OS.`);
  }
  const id = newId();
  const expires = new Date(Date.now() + cfg.limits.approvalTtlHours * 3600_000).toISOString();
  db.prepare(`insert into approvals (id, action_type, payload, summary, requested_by, task_id, status, expires_at, created_at)
    values (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`).run(id, p.actionType, JSON.stringify(p.payload), p.summary, p.requestedBy, p.taskId ?? null, expires, now());
  audit(db, p.requestedBy, 'approval.requested', id, { actionType: p.actionType, summary: p.summary });
  const row = getApproval(db, id)!;
  try {
    await notifier.sendApprovalRequest(row);
  } catch (e) {
    // La demande reste en attente et visible sur le dashboard même si Telegram échoue.
    audit(db, 'system', 'notify.failed', id, { error: String(e) });
  }
  return row;
}

/**
 * Exécuteurs : appelés UNIQUEMENT après approbation humaine.
 * En bac à sable, ils simulent l'action — rien ne quitte la machine.
 */
const EXECUTORS: Record<string, (a: ApprovalRow, cfg: Config) => Promise<unknown>> = {
  'outreach.send': async (a, cfg) => {
    if (cfg.mode !== 'sandbox') throw new Error('Exécuteur outreach réel non implémenté (phase 2).');
    return { simulated: true, note: `SIMULATION : message ${String(a.payload.channel)} non envoyé à ${String(a.payload.company)}` };
  },
  'website.publish': async () => { throw new Error('Publication non disponible avant la phase 3 (FORGE + GUARD).'); },
  'client.read_sensitive': async () => { throw new Error('Accès aux données sensibles non disponible dans le MVP.'); },
};

export async function decide(
  db: DB, cfg: Config, id: string, decision: 'approved' | 'rejected', decidedBy: string, channel: string,
): Promise<ApprovalRow> {
  const a = getApproval(db, id);
  if (!a) throw new Error(`Approbation introuvable : ${id}`);
  if (a.status !== 'pending') throw new Error(`Approbation déjà traitée (${a.status})`);
  if (a.expires_at < now()) {
    db.prepare("update approvals set status = 'expired' where id = ?").run(id);
    audit(db, 'system', 'approval.expired', id);
    throw new Error('Approbation expirée');
  }
  // Mise à jour conditionnelle : empêche une double décision concurrente (Telegram + dashboard).
  const res = db.prepare("update approvals set status = ?, decided_by = ?, decided_at = ?, channel = ? where id = ? and status = 'pending'")
    .run(decision, decidedBy, now(), channel, id);
  if (res.changes !== 1) throw new Error('Approbation déjà traitée');
  audit(db, decidedBy, `approval.${decision}`, id, { channel, actionType: a.action_type });

  if (decision === 'approved') {
    try {
      const exec = EXECUTORS[a.action_type];
      if (!exec) throw new Error(`Aucun exécuteur pour ${a.action_type}`);
      const result = await exec(a, cfg);
      db.prepare("update approvals set status = 'executed', result = ? where id = ?").run(JSON.stringify(result), id);
      if (a.action_type === 'outreach.send' && a.payload.lead_id) {
        db.prepare("update leads set status = 'contacted' where id = ?").run(String(a.payload.lead_id));
      }
      audit(db, 'system', 'approval.executed', id, result);
    } catch (e) {
      db.prepare("update approvals set status = 'failed', result = ? where id = ?").run(JSON.stringify({ error: String(e) }), id);
      audit(db, 'system', 'approval.execution_failed', id, { error: String(e) });
    }
  }
  return getApproval(db, id)!;
}

export function expireApprovals(db: DB): number {
  const rows = db.prepare("select id from approvals where status = 'pending' and expires_at < ?").all(now()) as { id: string }[];
  for (const r of rows) {
    db.prepare("update approvals set status = 'expired' where id = ? and status = 'pending'").run(r.id);
    audit(db, 'system', 'approval.expired', r.id);
  }
  return rows.length;
}
