import { existsSync } from 'node:fs';
import { now, type DB } from './db.ts';
import { audit } from './audit.ts';
import type { Config } from '../config.ts';

export class EmergencyStopError extends Error {
  constructor(reason: string) { super(`Arrêt d'urgence actif : ${reason}`); this.name = 'EmergencyStopError'; }
}

export function getState(db: DB, key: string): string | undefined {
  const r = db.prepare('select value from system_state where key = ?').get(key) as { value: string } | undefined;
  return r?.value;
}

export function setState(db: DB, key: string, value: string) {
  db.prepare(`insert into system_state (key, value, updated_at) values (?, ?, ?)
    on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at`).run(key, value, now());
}

/** Arrêt actif si le drapeau en base est levé OU si le fichier os/STOP existe (secours si la base est cassée). */
export function stopReason(db: DB, cfg: Config): string | null {
  if (existsSync(cfg.stopFile)) return 'fichier STOP présent';
  const v = getState(db, 'emergency_stop');
  return v ? (JSON.parse(v) as { reason: string }).reason : null;
}

export function assertRunning(db: DB, cfg: Config) {
  const r = stopReason(db, cfg);
  if (r) throw new EmergencyStopError(r);
}

export function emergencyStop(db: DB, actor: string, reason: string) {
  setState(db, 'emergency_stop', JSON.stringify({ reason, actor, at: now() }));
  audit(db, actor, 'system.emergency_stop', null, { reason });
}

export function resume(db: DB, actor: string) {
  db.prepare("delete from system_state where key = 'emergency_stop'").run();
  setState(db, 'consecutive_failures', '0');
  audit(db, actor, 'system.resume');
}

/** Disjoncteur : après N échecs consécutifs, arrêt d'urgence automatique. */
export function recordFailure(db: DB, cfg: Config): boolean {
  const n = Number(getState(db, 'consecutive_failures') ?? '0') + 1;
  setState(db, 'consecutive_failures', String(n));
  if (n >= cfg.limits.circuitBreakerErrors) {
    emergencyStop(db, 'system', `disjoncteur : ${n} échecs consécutifs`);
    return true;
  }
  return false;
}

export function recordSuccess(db: DB) {
  setState(db, 'consecutive_failures', '0');
}
