import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { BetaTool } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { newId, now, parseRow, type DB } from '../core/db.ts';
import { audit } from '../core/audit.ts';
import { requestApproval, listApprovals } from '../core/approvals.ts';
import { spending } from '../core/budget.ts';
import { stopReason } from '../core/state.ts';
import type { Config } from '../config.ts';
import type { Notifier } from '../telegram/notifier.ts';

export interface ToolContext {
  db: DB;
  cfg: Config;
  notifier: Notifier;
  agentId: string;
  taskId: string;
  runId: string;
  depth: number;
  /** Fourni par le runner pour la délégation (évite les imports circulaires). */
  runSubtask: (agentId: string, brief: string) => Promise<{ status: string; summary: string }>;
}

export interface ToolDef {
  name: string;
  description: string;
  input_schema: BetaTool['input_schema'];
  run: (input: any, ctx: ToolContext) => Promise<unknown>;
}

const obj = (properties: Record<string, unknown>, required: string[]): BetaTool['input_schema'] =>
  ({ type: 'object', properties, required, additionalProperties: false }) as BetaTool['input_schema'];

interface Company {
  id: string; name: string; sector: string; city: string; district: string; has_website: boolean;
  website: string | null; website_quality: number; google_rating: number; reviews: number;
  instagram_followers: number; languages: string[]; contact_email: string | null;
}

function loadCompanies(cfg: Config): Company[] {
  if (cfg.mode !== 'sandbox') throw new Error('Source de données réelle non configurée (phase 2).');
  const raw = JSON.parse(readFileSync(path.join(cfg.sandboxDataDir, 'companies.json'), 'utf8'));
  return raw.companies as Company[];
}

/** Score d'opportunité déterministe (0–100) : réputation forte + présence web faible = besoin TIMBI AI. */
export function scoreCompany(c: Company): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let s = 0;
  if (!c.has_website) { s += 40; reasons.push('aucun site web'); }
  else if (c.website_quality <= 4) { s += 28; reasons.push(`site faible (${c.website_quality}/10)`); }
  else if (c.website_quality <= 6) { s += 12; reasons.push(`site moyen (${c.website_quality}/10)`); }
  if (c.google_rating >= 4.5) { s += 20; reasons.push(`excellente note Google (${c.google_rating})`); }
  else if (c.google_rating >= 4.2) { s += 10; reasons.push(`bonne note Google (${c.google_rating})`); }
  if (c.reviews >= 300) { s += 15; reasons.push(`${c.reviews} avis : clientèle établie`); }
  else if (c.reviews >= 100) { s += 8; reasons.push(`${c.reviews} avis`); }
  if (c.instagram_followers >= 5000) { s += 10; reasons.push('audience Instagram à convertir'); }
  if (c.languages.some((l) => l === 'fr' || l === 'en')) { s += 10; reasons.push('clientèle internationale (FR/EN)'); }
  if (c.city !== 'Istanbul') { s -= 15; reasons.push('hors Istanbul'); }
  return { score: Math.max(0, Math.min(100, s)), reasons };
}

export const TOOLS: Record<string, ToolDef> = {
  get_system_status: {
    name: 'get_system_status',
    description: "État de TIMBI OS : arrêt d'urgence, dépenses du jour et du mois, approbations en attente, tâches en cours.",
    input_schema: obj({}, []),
    run: async (_i, { db, cfg }) => {
      const s = spending(db, cfg);
      const tasks = db.prepare("select status, count(*) as n from tasks group by status").all();
      return {
        emergency_stop: stopReason(db, cfg),
        spend_today_usd: +s.today.toFixed(4), daily_cap_usd: cfg.budget.dailyUsd,
        spend_month_usd: +s.month.toFixed(4), monthly_cap_usd: cfg.budget.monthlyUsd,
        pending_approvals: listApprovals(db, 'pending').length,
        tasks,
      };
    },
  },

  memory_read: {
    name: 'memory_read',
    description: "Lit la mémoire partagée. scope = global | agent | project. Si key est vide, liste les clés du scope.",
    input_schema: obj({
      scope: { type: 'string', enum: ['global', 'agent', 'project'] },
      key: { type: 'string', description: 'Clé à lire ; chaîne vide pour lister.' },
    }, ['scope', 'key']),
    run: async ({ scope, key }, { db, agentId }) => {
      const scopeId = scope === 'agent' ? agentId : '';
      if (!key) return db.prepare('select key, updated_by, updated_at from memory where scope = ? and scope_id = ?').all(scope, scopeId);
      const r = db.prepare('select value from memory where scope = ? and scope_id = ? and key = ?').get(scope, scopeId, key) as { value: string } | undefined;
      return r ? JSON.parse(r.value) : { found: false };
    },
  },

  memory_write: {
    name: 'memory_write',
    description: "Écrit une note durable dans la mémoire partagée (apprentissages, préférences, contexte). Jamais de données personnelles sensibles.",
    input_schema: obj({
      scope: { type: 'string', enum: ['global', 'agent'] },
      key: { type: 'string' },
      value: { type: 'string', description: 'Contenu (texte, max 2000 caractères).' },
    }, ['scope', 'key', 'value']),
    run: async ({ scope, key, value }, { db, agentId }) => {
      const scopeId = scope === 'agent' ? agentId : '';
      const v = JSON.stringify(String(value).slice(0, 2000));
      db.prepare(`insert into memory (id, scope, scope_id, key, value, updated_by, updated_at) values (?, ?, ?, ?, ?, ?, ?)
        on conflict(scope, scope_id, key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
        .run(newId(), scope, scopeId, key, v, agentId, now());
      audit(db, agentId, 'memory.write', `${scope}:${key}`);
      return { ok: true };
    },
  },

  search_companies: {
    name: 'search_companies',
    description: "Recherche des entreprises (bac à sable : jeu de données fictif). Filtre par secteur et ville. Les e-mails de contact ne sont jamais renvoyés.",
    input_schema: obj({
      query: { type: 'string', description: 'Description libre de la cible.' },
      sector: { type: 'string', description: 'restaurant | clinique | beaute | services | commerce | hotellerie, ou vide.' },
      city: { type: 'string' },
      max_results: { type: 'integer' },
    }, ['query', 'sector', 'city', 'max_results']),
    run: async ({ sector, city, max_results }, { cfg }) => {
      const all = loadCompanies(cfg);
      const res = all
        .filter((c) => !sector || c.sector === sector)
        .filter((c) => !city || c.city.toLowerCase() === String(city).toLowerCase())
        .slice(0, Math.min(Number(max_results) || 5, 10))
        // Minimisation des données : pas de contact_email exposé au modèle.
        .map(({ contact_email: _omit, ...pub }) => ({ ...pub, has_contact: Boolean(_omit) }));
      return { source: 'sandbox-fictif', count: res.length, companies: res };
    },
  },

  score_lead: {
    name: 'score_lead',
    description: "Calcule un score d'opportunité 0–100 pour une entreprise (grille TIMBI AI déterministe) avec ses raisons.",
    input_schema: obj({ company_id: { type: 'string' } }, ['company_id']),
    run: async ({ company_id }, { cfg }) => {
      const c = loadCompanies(cfg).find((x) => x.id === company_id);
      if (!c) throw new Error(`Entreprise inconnue : ${company_id}`);
      return { company_id, company: c.name, ...scoreCompany(c) };
    },
  },

  save_lead: {
    name: 'save_lead',
    description: "Enregistre un prospect qualifié dans le CRM interne. Idempotent par company_id.",
    input_schema: obj({
      company_id: { type: 'string' }, score: { type: 'integer' }, rationale: { type: 'string' },
    }, ['company_id', 'score', 'rationale']),
    run: async ({ company_id, score, rationale }, { db, cfg, agentId }) => {
      const c = loadCompanies(cfg).find((x) => x.id === company_id);
      if (!c) throw new Error(`Entreprise inconnue : ${company_id}`);
      const existing = db.prepare('select id from leads where external_ref = ?').get(company_id) as { id: string } | undefined;
      const id = existing?.id ?? newId();
      const signals = JSON.stringify({ rating: c.google_rating, reviews: c.reviews, website_quality: c.website_quality, languages: c.languages });
      db.prepare(`insert into leads (id, external_ref, company, sector, city, website, score, rationale, signals, status, is_fictitious, created_by, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'qualified', 1, ?, ?)
        on conflict(external_ref) do update set score = excluded.score, rationale = excluded.rationale, signals = excluded.signals`)
        .run(id, company_id, c.name, c.sector, c.city, c.website, Math.round(score), String(rationale).slice(0, 1000), signals, agentId, now());
      audit(db, agentId, 'lead.saved', id, { company: c.name, score });
      return { lead_id: id, company: c.name, status: 'qualified' };
    },
  },

  list_leads: {
    name: 'list_leads',
    description: 'Liste les prospects du CRM interne, triés par score.',
    input_schema: obj({ min_score: { type: 'integer' } }, ['min_score']),
    run: async ({ min_score }, { db }) =>
      db.prepare('select id, company, sector, city, score, status, created_at from leads where score >= ? order by score desc limit 25')
        .all(Number(min_score) || 0),
  },

  request_outreach_approval: {
    name: 'request_outreach_approval',
    description: "Demande au propriétaire l'autorisation d'envoyer un premier message à un prospect. N'ENVOIE RIEN : crée une demande d'approbation Telegram. L'envoi n'aura lieu qu'après validation humaine.",
    input_schema: obj({
      lead_id: { type: 'string', description: 'lead_id renvoyé par save_lead (le company_id est aussi accepté).' },
      channel: { type: 'string', enum: ['email', 'whatsapp'] },
      message_draft: { type: 'string', description: 'Brouillon court, poli, dans la langue du prospect.' },
    }, ['lead_id', 'channel', 'message_draft']),
    run: async ({ lead_id, channel, message_draft }, { db, cfg, notifier, agentId, taskId }) => {
      // Accepte le lead_id renvoyé par save_lead OU l'identifiant d'entreprise (company_id) : erreur fréquente du modèle.
      const lead = db.prepare('select * from leads where id = ? or external_ref = ?').get(lead_id, lead_id);
      if (!lead) throw new Error(`Prospect inconnu : ${lead_id}. Enregistre-le d'abord avec save_lead.`);
      const l = parseRow<{ id: string; company: string; score: number; status: string }>(lead);
      lead_id = l.id;
      if (l.status === 'contacted') return { status: 'skipped', note: `${l.company} a déjà été contacté. Aucune nouvelle demande.` };
      // Anti-doublon : jamais deux demandes de contact actives pour le même prospect.
      const dup = db.prepare("select id from approvals where action_type = 'outreach.send' and status in ('pending', 'approved', 'executed') and json_extract(payload, '$.lead_id') = ?")
        .get(lead_id) as { id: string } | undefined;
      if (dup) return { approval_id: dup.id, status: 'duplicate', note: `Une demande existe déjà pour ${l.company}. Choisis un autre prospect ou n'en demande pas.` };
      const a = await requestApproval(db, cfg, notifier, {
        actionType: 'outreach.send',
        payload: { lead_id, company: l.company, channel, message_draft: String(message_draft).slice(0, 1500) },
        summary: `Premier contact ${channel} avec ${l.company} (score ${l.score}/100).`,
        requestedBy: agentId,
        taskId,
      });
      return { approval_id: a.id, status: 'pending', note: "En attente de décision humaine. Ne pas considérer le message comme envoyé." };
    },
  },

  delegate_to_agent: {
    name: 'delegate_to_agent',
    description: "Confie une sous-mission à un agent spécialisé actif et attend son compte rendu. Agents actifs : hunter.",
    input_schema: obj({
      agent_id: { type: 'string', enum: ['hunter'] },
      brief: { type: 'string', description: 'Mission précise, résultat attendu, contraintes.' },
    }, ['agent_id', 'brief']),
    run: async ({ agent_id, brief }, ctx) => {
      if (ctx.depth >= ctx.cfg.limits.maxDelegationDepth) throw new Error('Profondeur de délégation maximale atteinte.');
      return ctx.runSubtask(agent_id, brief);
    },
  },

  create_task: {
    name: 'create_task',
    description: "Planifie une tâche asynchrone pour un agent actif (exécutée par la file de tâches).",
    input_schema: obj({
      agent_id: { type: 'string', enum: ['hunter', 'atlas'] },
      title: { type: 'string' }, brief: { type: 'string' },
    }, ['agent_id', 'title', 'brief']),
    run: async ({ agent_id, title, brief }, { db, cfg, agentId, taskId }) => {
      const id = createTask(db, cfg, { agentId: agent_id, title, brief, createdBy: agentId, parentTaskId: taskId });
      return { task_id: id, status: 'queued' };
    },
  },

  notify_owner: {
    name: 'notify_owner',
    description: "Envoie une information au propriétaire de TIMBI AI (et à lui seul) sur Telegram. Pas pour les clients.",
    input_schema: obj({ message: { type: 'string' } }, ['message']),
    run: async ({ message }, { db, notifier, agentId }) => {
      await notifier.notifyOwner(`[${agentId.toUpperCase()}] ${String(message).slice(0, 3500)}`);
      audit(db, agentId, 'owner.notified');
      return { ok: true };
    },
  },
};

export function createTask(
  db: DB, cfg: Config,
  p: { agentId: string; title: string; brief: string; createdBy: string; parentTaskId?: string | null; projectId?: string },
): string {
  const id = newId();
  const ts = now();
  db.prepare(`insert into tasks (id, project_id, agent_id, parent_task_id, title, input, status, attempts, max_attempts, next_attempt_at, created_by, created_at, updated_at)
    values (?, ?, ?, ?, ?, ?, 'queued', 0, ?, ?, ?, ?, ?)`)
    .run(id, p.projectId ?? 'internal', p.agentId, p.parentTaskId ?? null, p.title.slice(0, 200), JSON.stringify({ brief: p.brief }), cfg.limits.maxTaskAttempts, ts, p.createdBy, ts, ts);
  audit(db, p.createdBy, 'task.created', id, { agentId: p.agentId, title: p.title });
  return id;
}

export function toolsFor(allowed: string[]): ToolDef[] {
  return allowed.map((n) => {
    const t = TOOLS[n];
    if (!t) throw new Error(`Outil inconnu dans le roster : ${n}`);
    return t;
  });
}
