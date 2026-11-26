import type { Deps } from '../core/runner.ts';
import { decide, listApprovals } from '../core/approvals.ts';
import { audit } from '../core/audit.ts';
import { spending } from '../core/budget.ts';
import { emergencyStop, resume, stopReason } from '../core/state.ts';
import { createTask } from '../tools/index.ts';
import { TelegramApi } from './api.ts';

interface Update {
  update_id: number;
  message?: { chat: { id: number }; from?: { id: number }; text?: string };
  callback_query?: { id: string; from: { id: number }; data?: string; message?: { chat: { id: number }; message_id: number; text?: string } };
}

const HELP = `Commandes TIMBI OS :
/status — état, budget, approbations
/approvals — approbations en attente
/hunt <brief> — lancer HUNTER
/atlas <objectif> — confier un objectif à ATLAS
/stop — ARRÊT D'URGENCE
/resume CONFIRMER — lever l'arrêt d'urgence`;

/**
 * Bot du propriétaire en long polling (pas de webhook public à exposer).
 * Toute mise à jour qui ne vient pas de TELEGRAM_OWNER_CHAT_ID est ignorée et journalisée.
 */
export class OwnerBot {
  private api: TelegramApi;
  private deps: Deps;
  private offset = 0;
  private running = false;

  constructor(deps: Deps) {
    this.deps = deps;
    this.api = new TelegramApi(deps.cfg.telegram.token);
  }

  private isOwner(id: number | undefined) {
    return id !== undefined && String(id) === this.deps.cfg.telegram.ownerChatId;
  }

  async start() {
    this.running = true;
    await this.api.call('setMyCommands', { commands: [
      { command: 'status', description: 'État et budget' },
      { command: 'approvals', description: 'Approbations en attente' },
      { command: 'hunt', description: 'Lancer HUNTER' },
      { command: 'atlas', description: 'Objectif pour ATLAS' },
      { command: 'stop', description: "Arrêt d'urgence" },
    ] }).catch(() => {});
    while (this.running) {
      try {
        const updates = await this.api.call<Update[]>('getUpdates', { offset: this.offset, timeout: 30, allowed_updates: ['message', 'callback_query'] });
        for (const u of updates) {
          this.offset = u.update_id + 1;
          await this.handle(u).catch((e) => audit(this.deps.db, 'telegram', 'telegram.handler_error', null, { error: String(e) }));
        }
      } catch (e) {
        audit(this.deps.db, 'telegram', 'telegram.poll_error', null, { error: String(e) });
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  stop() { this.running = false; }

  private reply(text: string) {
    return this.api.call('sendMessage', { chat_id: this.deps.cfg.telegram.ownerChatId, text });
  }

  async handle(u: Update) {
    const { db, cfg } = this.deps;
    if (u.callback_query) {
      const q = u.callback_query;
      if (!this.isOwner(q.from.id)) { audit(db, 'telegram', 'telegram.unauthorized', String(q.from.id)); return; }
      const [kind, id] = String(q.data ?? '').split(':');
      if ((kind !== 'apv' && kind !== 'rej') || !id) return;
      let text: string;
      try {
        const a = await decide(db, cfg, id, kind === 'apv' ? 'approved' : 'rejected', 'owner', 'telegram');
        text = `${kind === 'apv' ? '✅ Approuvé' : '❌ Refusé'} → statut : ${a.status}`;
      } catch (e) {
        text = `⚠️ ${e instanceof Error ? e.message : String(e)}`;
      }
      await this.api.call('answerCallbackQuery', { callback_query_id: q.id, text: text.slice(0, 190) });
      if (q.message) {
        await this.api.call('editMessageText', {
          chat_id: q.message.chat.id, message_id: q.message.message_id,
          text: `${q.message.text ?? ''}\n\n— ${text}`.slice(0, 4000),
        }).catch(() => {});
      }
      return;
    }

    const m = u.message;
    if (!m?.text) return;
    if (!this.isOwner(m.from?.id) || !this.isOwner(m.chat.id)) {
      audit(db, 'telegram', 'telegram.unauthorized', String(m.from?.id ?? m.chat.id));
      return;
    }
    const [cmd, ...rest] = m.text.trim().split(/\s+/);
    const arg = rest.join(' ');
    switch (cmd.split('@')[0]) {
      case '/stop':
        emergencyStop(db, 'owner', 'commande Telegram /stop');
        return this.reply("🛑 Arrêt d'urgence ACTIVÉ. Aucun agent ne s'exécutera. /resume CONFIRMER pour reprendre.");
      case '/resume':
        if (arg !== 'CONFIRMER') return this.reply('Pour reprendre, envoyez exactement : /resume CONFIRMER');
        resume(db, 'owner');
        return this.reply('▶️ Arrêt levé. Les agents peuvent reprendre.');
      case '/status': {
        const s = spending(db, cfg);
        return this.reply([
          `Mode : ${cfg.mode} · LLM ${cfg.llmMode}`,
          `Arrêt d'urgence : ${stopReason(db, cfg) ?? 'non'}`,
          `Dépenses : ${s.today.toFixed(3)} $ aujourd'hui / ${cfg.budget.dailyUsd} $ · ${s.month.toFixed(3)} $ ce mois / ${cfg.budget.monthlyUsd} $`,
          `Approbations en attente : ${listApprovals(db, 'pending').length}`,
        ].join('\n'));
      }
      case '/approvals': {
        const p = listApprovals(db, 'pending');
        if (!p.length) return this.reply('Aucune approbation en attente.');
        for (const a of p.slice(0, 5)) await this.deps.notifier.sendApprovalRequest(a);
        return;
      }
      case '/hunt':
      case '/atlas': {
        if (!arg) return this.reply(`Usage : ${cmd} <brief>`);
        const agentId = cmd === '/hunt' ? 'hunter' : 'atlas';
        const id = createTask(db, cfg, { agentId, title: arg.slice(0, 120), brief: arg, createdBy: 'owner' });
        return this.reply(`📋 Tâche ${agentId.toUpperCase()} en file : ${id.slice(0, 8)}`);
      }
      default:
        return this.reply(HELP);
    }
  }
}
