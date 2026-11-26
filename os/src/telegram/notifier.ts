import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Config } from '../config.ts';
import type { ApprovalRow } from '../core/approvals.ts';
import { TelegramApi } from './api.ts';

/** Canal vers le propriétaire uniquement (jamais vers un client ou un prospect). */
export interface Notifier {
  notifyOwner(text: string): Promise<void>;
  sendApprovalRequest(a: ApprovalRow): Promise<void>;
}

export function approvalText(a: ApprovalRow): string {
  const draft = typeof a.payload.message_draft === 'string' ? `\n\nBrouillon :\n${a.payload.message_draft}` : '';
  return `🔐 Approbation requise — ${a.action_type}\nDemandé par : ${a.requested_by.toUpperCase()}\n\n${a.summary}${draft}\n\nExpire : ${a.expires_at}\nID : ${a.id}`;
}

/** Bac à sable : écrit dans data/telegram-outbox.log au lieu d'envoyer. */
export class MockNotifier implements Notifier {
  readonly sent: string[] = [];
  private outboxPath: string | null;
  constructor(outboxPath: string | null) { this.outboxPath = outboxPath; }
  private write(text: string) {
    this.sent.push(text);
    if (!this.outboxPath) return;
    mkdirSync(path.dirname(this.outboxPath), { recursive: true });
    appendFileSync(this.outboxPath, `[${new Date().toISOString()}]\n${text}\n${'─'.repeat(40)}\n`);
  }
  async notifyOwner(text: string) { this.write(`📣 ${text}`); }
  async sendApprovalRequest(a: ApprovalRow) {
    this.write(`${approvalText(a)}\n→ npm run cli -- approve ${a.id}   |   npm run cli -- reject ${a.id}`);
  }
}

export class TelegramNotifier implements Notifier {
  private api: TelegramApi;
  private ownerChatId: string;
  constructor(api: TelegramApi, ownerChatId: string) { this.api = api; this.ownerChatId = ownerChatId; }
  async notifyOwner(text: string) {
    await this.api.call('sendMessage', { chat_id: this.ownerChatId, text: text.slice(0, 4000) });
  }
  async sendApprovalRequest(a: ApprovalRow) {
    await this.api.call('sendMessage', {
      chat_id: this.ownerChatId,
      text: approvalText(a).slice(0, 4000),
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Approuver', callback_data: `apv:${a.id}` },
          { text: '❌ Refuser', callback_data: `rej:${a.id}` },
        ]],
      },
    });
  }
}

export function makeNotifier(cfg: Config): Notifier {
  if (cfg.telegram.mode === 'live') return new TelegramNotifier(new TelegramApi(cfg.telegram.token), cfg.telegram.ownerChatId);
  return new MockNotifier(cfg.outboxPath);
}
