import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { ROOT } from './config.ts';

const [cmd, ...args] = process.argv.slice(2);
const arg = args.join(' ').trim();

async function main() {
  if (cmd === 'init') return init();

  const { bootstrap } = await import('./app.ts');
  const { runTask } = await import('./core/runner.ts');
  const { createTask } = await import('./tools/index.ts');
  const { decide, listApprovals } = await import('./core/approvals.ts');
  const { emergencyStop, resume, stopReason } = await import('./core/state.ts');
  const { verifyAudit } = await import('./core/audit.ts');
  const { spending } = await import('./core/budget.ts');
  const deps = bootstrap();
  const { db, cfg } = deps;

  switch (cmd) {
    case 'hunt':
    case 'atlas': {
      const agentId = cmd === 'hunt' ? 'hunter' : 'atlas';
      const brief = arg || (agentId === 'hunter'
        ? 'Trouve des restaurants et cafés à Istanbul avec une forte réputation mais une présence web faible.'
        : 'Lance la prospection de la semaine sur les restaurants d\'Istanbul et fais-moi un point.');
      const id = createTask(db, cfg, { agentId, title: brief.slice(0, 120), brief, createdBy: 'owner-cli' });
      console.log(`▶ ${agentId.toUpperCase()} · tâche ${id} · LLM ${cfg.llmMode} · Telegram ${cfg.telegram.mode}`);
      const t = await runTask(deps, id);
      console.log(`\nStatut : ${t.status}${t.error ? ` — ${t.error}` : ''}`);
      if (t.result) console.log(`\n${(t.result as { summary: string }).summary}`);
      const p = listApprovals(db, 'pending');
      if (p.length) console.log(`\n🔐 ${p.length} approbation(s) en attente → npm run cli -- approvals`);
      return;
    }
    case 'approvals': {
      const p = listApprovals(db, 'pending');
      if (!p.length) return console.log('Aucune approbation en attente.');
      for (const a of p) console.log(`\n${a.id}\n  ${a.action_type} · ${a.summary}\n  Brouillon : ${String(a.payload.message_draft ?? '—')}`);
      return;
    }
    case 'approve':
    case 'reject': {
      if (!arg) throw new Error(`Usage : npm run cli -- ${cmd} <id>`);
      const a = await decide(db, cfg, arg, cmd === 'approve' ? 'approved' : 'rejected', 'owner-cli', 'cli');
      return console.log(`${a.status} · ${JSON.stringify(a.result ?? {})}`);
    }
    case 'stop':
      emergencyStop(db, 'owner-cli', arg || 'commande CLI');
      return console.log("🛑 Arrêt d'urgence activé.");
    case 'resume':
      resume(db, 'owner-cli');
      return console.log('▶ Arrêt levé.');
    case 'status': {
      const s = spending(db, cfg);
      console.log(`Mode ${cfg.mode} · LLM ${cfg.llmMode} · Telegram ${cfg.telegram.mode}`);
      console.log(`Arrêt d'urgence : ${stopReason(db, cfg) ?? 'non'}`);
      console.log(`Dépenses : ${s.today.toFixed(4)} $ / ${cfg.budget.dailyUsd} $ aujourd'hui · ${s.month.toFixed(4)} $ / ${cfg.budget.monthlyUsd} $ ce mois`);
      console.log(`Approbations en attente : ${listApprovals(db, 'pending').length}`);
      return;
    }
    case 'audit:verify': {
      const r = verifyAudit(db);
      console.log(r.ok ? `✅ Journal intègre (${r.checked} entrées)` : `❌ Journal altéré à l'entrée ${r.brokenAt}`);
      if (!r.ok) process.exitCode = 2;
      return;
    }
    default:
      console.log(`Commandes : init | hunt [brief] | atlas [objectif] | approvals | approve <id> | reject <id> | stop [raison] | resume | status | audit:verify`);
  }
}

/** Crée .env depuis .env.example et génère un jeton de dashboard aléatoire. Aucun secret n'est écrit dans le code. */
function init() {
  const env = path.join(ROOT, '.env');
  if (!existsSync(env)) copyFileSync(path.join(ROOT, '.env.example'), env);
  let content = readFileSync(env, 'utf8');
  if (!/^DASHBOARD_TOKEN=.+/m.test(content)) {
    content += `\nDASHBOARD_TOKEN=${randomBytes(24).toString('hex')}\n`;
    writeFileSync(env, content);
  }
  console.log('✅ .env prêt (mode bac à sable, LLM simulé, Telegram simulé).');
  console.log('   Étape suivante : npm run hunt   puis   npm start  (dashboard sur http://127.0.0.1:4747)');
}

main().catch((e) => {
  console.error(`❌ ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
});
