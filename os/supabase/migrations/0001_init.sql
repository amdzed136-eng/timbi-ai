-- TIMBI OS — schéma Supabase (Postgres) — phase 2
-- Miroir du schéma SQLite du bac à sable (src/core/db.ts).
-- Le backend des agents utilise la clé service_role (contourne la RLS) : elle ne doit
-- JAMAIS être exposée au navigateur. Le dashboard utilise la clé anon + session utilisateur.

create extension if not exists pgcrypto;

-- ── Rôles humains ───────────────────────────────────────────────────────────
create type timbi_role as enum ('owner', 'admin', 'viewer');

create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       timbi_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create or replace function public.timbi_role() returns timbi_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- ── Tables métier ───────────────────────────────────────────────────────────
create table public.agents (
  id text primary key, name text not null, role text not null,
  status text not null default 'planned' check (status in ('active','paused','planned')),
  permissions jsonb not null default '[]', model text, effort text
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null, client text, status text not null default 'active',
  sensitivity text not null default 'internal' check (sensitivity in ('internal','client_confidential')),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id),
  agent_id text not null references public.agents(id),
  parent_task_id uuid references public.tasks(id),
  title text not null, input jsonb not null default '{}',
  status text not null default 'queued'
    check (status in ('queued','running','done','failed','cancelled')),
  attempts int not null default 0, max_attempts int not null default 3,
  next_attempt_at timestamptz not null default now(),
  result jsonb, error text, created_by text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id), agent_id text not null,
  status text not null, iterations int not null default 0,
  cost_usd numeric(12,6) not null default 0,
  started_at timestamptz not null default now(), ended_at timestamptz, error text
);

create table public.llm_calls (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.runs(id), agent_id text not null, model text not null,
  input_tokens int not null, output_tokens int not null,
  cache_read_tokens int not null default 0, cache_write_tokens int not null default 0,
  cost_usd numeric(12,6) not null, created_at timestamptz not null default now()
);

create table public.memory (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global','agent','project')),
  scope_id text not null default '', key text not null, value jsonb not null,
  updated_by text not null, updated_at timestamptz not null default now(),
  unique (scope, scope_id, key)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  external_ref text, company text not null, sector text, city text, website text,
  score int, rationale text, signals jsonb not null default '{}',
  status text not null default 'new' check (status in ('new','qualified','contacted','rejected')),
  is_fictitious boolean not null default true, created_by text not null,
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  action_type text not null, payload jsonb not null, summary text not null,
  requested_by text not null, task_id uuid references public.tasks(id),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired','executed','failed')),
  decided_by text, decided_at timestamptz, channel text, result jsonb,
  expires_at timestamptz not null, created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigserial primary key, ts timestamptz not null default now(),
  actor text not null, action text not null, target text, details jsonb not null default '{}',
  prev_hash text not null, hash text not null unique
);

create table public.system_state (key text primary key, value text not null, updated_at timestamptz not null default now());

-- ── Journal d'audit en ajout seul ───────────────────────────────────────────
create or replace function public.audit_log_immutable() returns trigger language plpgsql as $$
begin raise exception 'audit_log est en ajout seul'; end $$;
create trigger audit_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();
revoke update, delete, truncate on public.audit_log from anon, authenticated;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.agents       enable row level security;
alter table public.projects     enable row level security;
alter table public.tasks        enable row level security;
alter table public.runs         enable row level security;
alter table public.llm_calls    enable row level security;
alter table public.memory       enable row level security;
alter table public.leads        enable row level security;
alter table public.approvals    enable row level security;
alter table public.audit_log    enable row level security;
alter table public.system_state enable row level security;

-- Lecture : tout membre de l'équipe (viewer et plus), sauf projets confidentiels réservés owner/admin.
create policy read_team on public.agents       for select using (public.timbi_role() is not null);
create policy read_team on public.tasks        for select using (public.timbi_role() is not null);
create policy read_team on public.runs         for select using (public.timbi_role() is not null);
create policy read_team on public.llm_calls    for select using (public.timbi_role() is not null);
create policy read_team on public.leads        for select using (public.timbi_role() is not null);
create policy read_team on public.approvals    for select using (public.timbi_role() is not null);
create policy read_team on public.system_state for select using (public.timbi_role() is not null);
create policy read_team on public.memory       for select using (public.timbi_role() in ('owner','admin'));
create policy read_admin on public.audit_log   for select using (public.timbi_role() in ('owner','admin'));
create policy read_projects on public.projects for select using (
  sensitivity = 'internal' and public.timbi_role() is not null
  or public.timbi_role() in ('owner','admin'));
create policy read_self on public.profiles     for select using (user_id = auth.uid() or public.timbi_role() = 'owner');

-- Décisions d'approbation : owner uniquement (un admin peut lire mais pas approuver).
create policy decide_owner on public.approvals for update
  using (public.timbi_role() = 'owner' and status = 'pending')
  with check (public.timbi_role() = 'owner');

-- Arrêt d'urgence : owner et admin peuvent l'activer ; seul l'owner le lève (contrôlé côté backend).
create policy stop_admin on public.system_state for update using (public.timbi_role() in ('owner','admin'));
