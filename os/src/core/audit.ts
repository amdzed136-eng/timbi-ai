import { createHash } from 'node:crypto';
import { now, type DB } from './db.ts';

const SECRET_KEY = /token|secret|password|api[_-]?key|authorization/i;

/** Masque récursivement tout champ dont le nom ressemble à un secret. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = SECRET_KEY.test(k) ? '[MASQUÉ]' : redact(v);
    return out;
  }
  return value;
}

function hashEntry(prevHash: string, ts: string, actor: string, action: string, target: string, details: string) {
  return createHash('sha256').update([prevHash, ts, actor, action, target, details].join('|')).digest('hex');
}

/** Ajoute une entrée au journal d'audit chaîné (ajout seul, imposé par trigger). */
export function audit(db: DB, actor: string, action: string, target: string | null = null, details: unknown = {}) {
  const prev = db.prepare('select hash from audit_log order by id desc limit 1').get() as { hash: string } | undefined;
  const prevHash = prev?.hash ?? 'GENESIS';
  const ts = now();
  const detailsJson = JSON.stringify(redact(details));
  const hash = hashEntry(prevHash, ts, actor, action, target ?? '', detailsJson);
  db.prepare('insert into audit_log (ts, actor, action, target, details, prev_hash, hash) values (?, ?, ?, ?, ?, ?, ?)')
    .run(ts, actor, action, target, detailsJson, prevHash, hash);
}

/** Recalcule toute la chaîne ; renvoie l'id de la première entrée altérée. */
export function verifyAudit(db: DB): { ok: boolean; checked: number; brokenAt?: number } {
  const rows = db.prepare('select * from audit_log order by id').all() as Array<{
    id: number; ts: string; actor: string; action: string; target: string | null; details: string; prev_hash: string; hash: string;
  }>;
  let prev = 'GENESIS';
  for (const r of rows) {
    const expected = hashEntry(prev, r.ts, r.actor, r.action, r.target ?? '', r.details);
    if (r.prev_hash !== prev || r.hash !== expected) return { ok: false, checked: rows.length, brokenAt: r.id };
    prev = r.hash;
  }
  return { ok: true, checked: rows.length };
}
