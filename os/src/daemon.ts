import { bootstrap } from './app.ts';
import { now } from './core/db.ts';
import { audit } from './core/audit.ts';
import { expireApprovals } from './core/approvals.ts';
import { processNextTask } from './core/runner.ts';
import { getState, setState, stopReason } from './core/state.ts';
import { createTask } from './tools/index.ts';
import { OwnerBot } from './telegram/bot.ts';
import { startDashboard } from './dashboard/server.ts';

/** Tâches planifiées, heure d'Istanbul (UTC+3). Désactivables via SCHEDULES_ENABLED=false. */
const SCHEDULES = [
  { id: 'hunter-morning', at: '09:00', agentId: 'hunter', brief: 'Prospection du matin : restaurants, cafés et cliniques à Istanbul avec une bonne réputation et une présence web faible. Qualifie au plus 4 entreprises.' },
  { id: 'atlas-evening', at: '18:30', agentId: 'atlas', brief: "Brief du soir : fais le point sur l'état du système, les prospects du jour et les approbations en attente, puis informe le propriétaire. Ne délègue pas de nouvelle prospection." },
];

function istanbulClock(d = new Date()) {
  const local = new Date(d.getTime() + 3 * 3600_000).toISOString();
  return { date: local.slice(0, 10), hhmm: local.slice(11, 16) };
}

const deps = bootstrap();
const { db, cfg } = deps;

// Reprise après crash : une tâche restée « running » est remise en file.
const stale = db.prepare("update tasks set status = 'queued', updated_at = ? where status = 'running'").run(now());
if (stale.changes) audit(db, 'system', 'tasks.recovered', null, { count: stale.changes });
audit(db, 'system', 'daemon.started', null, { mode: cfg.mode, llm: cfg.llmMode, telegram: cfg.telegram.mode });

let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    expireApprovals(db);
    if (process.env.SCHEDULES_ENABLED !== 'false') {
      const { date, hhmm } = istanbulClock();
      for (const s of SCHEDULES) {
        if (hhmm >= s.at && getState(db, `schedule:${s.id}`) !== date) {
          setState(db, `schedule:${s.id}`, date);
          createTask(db, cfg, { agentId: s.agentId, title: `[planifié] ${s.id}`, brief: s.brief, createdBy: 'scheduler' });
        }
      }
    }
    if (!stopReason(db, cfg)) await processNextTask(deps);
  } catch (e) {
    audit(db, 'system', 'daemon.tick_error', null, { error: String(e) });
  } finally {
    busy = false;
  }
}

setInterval(tick, 15_000);
void tick();

startDashboard(deps);

if (cfg.telegram.mode === 'live') {
  const bot = new OwnerBot(deps);
  void bot.start();
  void deps.notifier.notifyOwner('🟢 TIMBI OS démarré (bac à sable). /help pour les commandes.').catch(() => {});
  console.log('Telegram : bot actif (long polling).');
} else {
  console.log(`Telegram simulé : messages dans ${cfg.outboxPath}`);
}
console.log(`TIMBI OS · mode ${cfg.mode} · LLM ${cfg.llmMode} · planificateur actif (heure d'Istanbul)`);
