import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { Deps } from '../core/runner.ts';
import { parseRow } from '../core/db.ts';
import { decide, listApprovals } from '../core/approvals.ts';
import { spending } from '../core/budget.ts';
import { emergencyStop, resume, stopReason } from '../core/state.ts';
import { verifyAudit } from '../core/audit.ts';
import { createTask } from '../tools/index.ts';
import { AGENT_ROSTER } from '../agents/roster.ts';

const HTML_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public', 'index.html');

function tokenOk(req: IncomingMessage, expected: string): boolean {
  const got = String(req.headers['x-timbi-token'] ?? '');
  if (!expected || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json') {
  res.writeHead(status, {
    'content-type': `${type}; charset=utf-8`,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'",
  });
  res.end(type === 'application/json' ? JSON.stringify(body) : String(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 10_000) throw new Error('Requête trop volumineuse'); }
  return raw ? JSON.parse(raw) : {};
}

export function overview(deps: Deps) {
  const { db, cfg } = deps;
  const s = spending(db, cfg);
  const q = (sql: string, ...p: Array<string | number>) => db.prepare(sql).all(...p);
  const costByAgent = q("select agent_id, round(sum(cost_usd), 4) as cost, count(*) as calls from llm_calls where created_at >= date('now', '-30 day') group by agent_id");
  const costByDay = q("select substr(created_at, 1, 10) as day, round(sum(cost_usd), 4) as cost from llm_calls where created_at >= date('now', '-14 day') group by day order by day");
  const lastRun = q('select agent_id, max(started_at) as at, status from runs group by agent_id');
  return {
    system: {
      mode: cfg.mode, llmMode: cfg.llmMode, telegramMode: cfg.telegram.mode,
      emergencyStop: stopReason(db, cfg), audit: verifyAudit(db),
    },
    budget: { today: s.today, month: s.month, ...cfg.budget },
    agents: AGENT_ROSTER.map((a) => ({ ...a, lastRun: lastRun.find((r: any) => r.agent_id === a.id) ?? null })),
    approvals: listApprovals(db),
    tasks: q('select id, agent_id, title, status, attempts, error, created_by, created_at, updated_at from tasks order by created_at desc limit 25'),
    leads: q('select id, company, sector, city, score, status, rationale, is_fictitious from leads order by score desc limit 25'),
    audit: q('select id, ts, actor, action, target from audit_log order by id desc limit 40'),
    costByAgent, costByDay,
    memory: q('select scope, scope_id, key, updated_by, updated_at from memory order by updated_at desc limit 20').map((r) => parseRow(r)),
  };
}

export function startDashboard(deps: Deps) {
  const { db, cfg } = deps;
  if (!cfg.dashboard.token) console.warn('⚠️ DASHBOARD_TOKEN absent : dashboard en lecture seule. Lancez `npm run setup`.');

  const server = createServer(async (req, res) => {
    try {
      // Protection contre le DNS rebinding : seuls les noms d'hôte locaux sont acceptés.
      const host = String(req.headers.host ?? '');
      if (host !== `127.0.0.1:${cfg.dashboard.port}` && host !== `localhost:${cfg.dashboard.port}`) return send(res, 403, { error: 'hôte refusé' });
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/') return send(res, 200, readFileSync(HTML_PATH, 'utf8'), 'text/html');
      if (req.method === 'GET' && url.pathname === '/api/overview') return send(res, 200, overview(deps));

      if (req.method !== 'POST') return send(res, 404, { error: 'introuvable' });
      // Toute action qui modifie l'état exige le jeton.
      if (!tokenOk(req, cfg.dashboard.token)) return send(res, 401, { error: 'jeton invalide' });

      const m = url.pathname.match(/^\/api\/approvals\/([0-9a-f-]{36})\/(approve|reject)$/);
      if (m) {
        const a = await decide(db, cfg, m[1], m[2] === 'approve' ? 'approved' : 'rejected', 'owner', 'dashboard');
        return send(res, 200, a);
      }
      if (url.pathname === '/api/emergency-stop') { emergencyStop(db, 'owner', 'bouton du dashboard'); return send(res, 200, { ok: true }); }
      if (url.pathname === '/api/resume') {
        const body = await readJson(req);
        if (body.confirm !== 'CONFIRMER') return send(res, 400, { error: 'confirmation requise' });
        resume(db, 'owner'); return send(res, 200, { ok: true });
      }
      if (url.pathname === '/api/tasks') {
        const body = await readJson(req);
        const agentId = body.agent_id === 'atlas' ? 'atlas' : 'hunter';
        const brief = String(body.brief ?? '').trim().slice(0, 2000);
        if (!brief) return send(res, 400, { error: 'brief requis' });
        return send(res, 200, { id: createTask(db, cfg, { agentId, title: brief.slice(0, 120), brief, createdBy: 'owner-dashboard' }) });
      }
      return send(res, 404, { error: 'introuvable' });
    } catch (e) {
      return send(res, 400, { error: e instanceof Error ? e.message : String(e) });
    }
  });
  // Uniquement en local : jamais exposé sur le réseau dans le MVP.
  server.listen(cfg.dashboard.port, '127.0.0.1', () => {
    console.log(`Dashboard : http://127.0.0.1:${cfg.dashboard.port}/#token=${cfg.dashboard.token ? '<voir DASHBOARD_TOKEN dans .env>' : ''}`);
  });
  return server;
}
