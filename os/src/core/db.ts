import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AGENT_ROSTER } from '../agents/roster.ts';

export type DB = DatabaseSync;

const SCHEMA = `
pragma journal_mode = wal;
pragma foreign_keys = on;

create table if not exists agents (
  id text primary key, name text not null, role text not null,
  status text not null default 'planned', permissions text not null default '[]',
  model text, effort text
);
create table if not exists projects (
  id text primary key, name text not null, client text, status text not null default 'active',
  sensitivity text not null default 'internal', created_at text not null
);
create table if not exists tasks (
  id text primary key, project_id text references projects(id), agent_id text not null references agents(id),
  parent_task_id text references tasks(id), title text not null, input text not null default '{}',
  status text not null default 'queued', attempts integer not null default 0,
  max_attempts integer not null default 3, next_attempt_at text not null,
  result text, error text, created_by text not null, created_at text not null, updated_at text not null
);
create table if not exists runs (
  id text primary key, task_id text not null references tasks(id), agent_id text not null,
  status text not null, iterations integer not null default 0, cost_usd real not null default 0,
  started_at text not null, ended_at text, error text
);
create table if not exists llm_calls (
  id text primary key, run_id text, agent_id text not null, model text not null,
  input_tokens integer not null, output_tokens integer not null,
  cache_read_tokens integer not null default 0, cache_write_tokens integer not null default 0,
  cost_usd real not null, created_at text not null
);
create index if not exists llm_calls_created on llm_calls(created_at);
create table if not exists memory (
  id text primary key, scope text not null, scope_id text not null default '', key text not null,
  value text not null, updated_by text not null, updated_at text not null,
  unique (scope, scope_id, key)
);
create table if not exists leads (
  id text primary key, external_ref text unique, company text not null, sector text, city text, website text,
  score integer, rationale text, signals text not null default '{}', status text not null default 'new',
  is_fictitious integer not null default 1, created_by text not null, created_at text not null
);
create table if not exists approvals (
  id text primary key, action_type text not null, payload text not null, summary text not null,
  requested_by text not null, task_id text, status text not null default 'pending',
  decided_by text, decided_at text, channel text, result text, expires_at text not null, created_at text not null
);
create table if not exists audit_log (
  id integer primary key autoincrement, ts text not null, actor text not null, action text not null,
  target text, details text not null default '{}', prev_hash text not null, hash text not null unique
);
create trigger if not exists audit_no_update before update on audit_log
  begin select raise(abort, 'audit_log est en ajout seul'); end;
create trigger if not exists audit_no_delete before delete on audit_log
  begin select raise(abort, 'audit_log est en ajout seul'); end;
create table if not exists system_state (key text primary key, value text not null, updated_at text not null);
`;

export const now = () => new Date().toISOString();
export const newId = () => randomUUID();

export function openDb(dbPath: string): DB {
  if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  seed(db);
  return db;
}

function seed(db: DB) {
  const upsertAgent = db.prepare(`
    insert into agents (id, name, role, status, permissions) values (?, ?, ?, ?, ?)
    on conflict(id) do update set name = excluded.name, role = excluded.role,
      status = excluded.status, permissions = excluded.permissions`);
  for (const a of AGENT_ROSTER) upsertAgent.run(a.id, a.name, a.role, a.status, JSON.stringify(a.tools));

  const hasProjects = db.prepare('select count(*) as n from projects').get() as { n: number };
  if (hasProjects.n === 0) {
    const ins = db.prepare('insert into projects (id, name, client, status, sensitivity, created_at) values (?, ?, ?, ?, ?, ?)');
    ins.run('internal', 'TIMBI AI — opérations internes', 'TIMBI AI', 'active', 'internal', now());
    // Aucune donnée personnelle du client tant que les règles d'accès ne sont pas validées.
    ins.run('thiallou', 'Thiallou Services — site vitrine', 'Thiallou Services', 'delivered', 'client_confidential', now());
  }
}

/** Les lignes de node:sqlite sont des objets sans prototype ; on parse les colonnes JSON connues. */
export function parseRow<T = Record<string, unknown>>(row: unknown, jsonCols: string[] = []): T {
  const out: Record<string, unknown> = { ...(row as object) };
  for (const c of jsonCols) {
    if (typeof out[c] === 'string') {
      try { out[c] = JSON.parse(out[c] as string); } catch { /* laisser tel quel */ }
    }
  }
  return out as T;
}
