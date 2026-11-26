import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { ROOT } from '../config.ts';
import { TelegramApi } from './api.ts';

/** Remplace (ou ajoute) des clés dans le contenu d'un .env, y compris si elles sont commentées. */
export function upsertEnv(content: string, values: Record<string, string>): string {
  let out = content;
  for (const [k, v] of Object.entries(values)) {
    const re = new RegExp(`^#?\\s*${k}=.*$`, 'm');
    out = re.test(out) ? out.replace(re, `${k}=${v}`) : `${out.replace(/\s*$/, '')}\n${k}=${v}\n`;
  }
  return out;
}

/** Saisie masquée : le jeton n'apparaît jamais à l'écran ni dans l'historique. */
export function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    process.stdout.write(`${question}\n`);
    if (!stdin.isTTY) {
      const rl = readline.createInterface({ input: stdin });
      rl.once('line', (l) => { rl.close(); resolve(l.trim()); });
      return;
    }
    // Lecture caractère par caractère : une seule « * » par caractère, rien d'autre à l'écran.
    let buf = '';
    const cleanup = () => { stdin.off('data', onData); stdin.setRawMode(false); stdin.pause(); };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') { cleanup(); process.stdout.write('\n'); resolve(buf.trim()); return; }
        if (ch === '\u0003') { cleanup(); process.stdout.write('\n'); reject(new Error('Saisie annulée.')); return; }
        if (ch === '\u007f' || ch === '\b') {
          if (buf.length) { buf = buf.slice(0, -1); process.stdout.write('\b \b'); }
          continue;
        }
        if (ch >= ' ') { buf += ch; process.stdout.write('*'); }
      }
    };
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    stdin.on('data', onData);
  });
}

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
  });
}

interface Upd { message?: { chat: { id: number; type: string; first_name?: string; username?: string } } }

export async function telegramSetup() {
  console.log('\n🔐 Configuration Telegram de TIMBI OS');
  console.log('Le jeton est saisi ici, masqué, puis écrit uniquement dans os/.env (ignoré par Git).\n');

  const token = await askHidden('Collez le jeton du bot (BotFather) puis Entrée : ');
  if (!/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(token)) throw new Error("Ce n'est pas un jeton Telegram valide (format 123456789:AAA…).");

  const api = new TelegramApi(token);
  const me = await api.call<{ username: string }>('getMe', {}).catch(() => {
    throw new Error('Telegram refuse ce jeton. Vérifiez que vous avez copié le NOUVEAU jeton en entier.');
  });
  console.log(`✅ Jeton valide : bot @${me.username}`);

  let chats: Map<number, string> = new Map();
  for (let attempt = 0; attempt < 5 && chats.size === 0; attempt++) {
    const updates = await api.call<Upd[]>('getUpdates', { timeout: 0, allowed_updates: ['message'] });
    chats = new Map(updates.filter((u) => u.message?.chat.type === 'private')
      .map((u) => [u.message!.chat.id, u.message!.chat.first_name ?? u.message!.chat.username ?? '?']));
    if (chats.size === 0) await ask(`\n👉 Ouvrez t.me/${me.username}, appuyez sur Démarrer, envoyez « bonjour », puis appuyez sur Entrée ici… `);
  }
  if (chats.size === 0) throw new Error("Aucun message reçu par le bot. Envoyez-lui « bonjour » puis relancez la commande.");

  let ownerId: number;
  if (chats.size === 1) {
    const [[id, name]] = [...chats];
    ownerId = id;
    console.log(`✅ Propriétaire détecté : ${name}`);
  } else {
    const list = [...chats];
    list.forEach(([, name], i) => console.log(`  ${i + 1}. ${name}`));
    const choice = Number(await ask('Plusieurs personnes ont écrit au bot. Lequel est VOUS ? Numéro : '));
    if (!list[choice - 1]) throw new Error('Choix invalide.');
    ownerId = list[choice - 1][0];
  }

  const envPath = path.join(ROOT, '.env');
  if (!existsSync(envPath)) copyFileSync(path.join(ROOT, '.env.example'), envPath);
  writeFileSync(envPath, upsertEnv(readFileSync(envPath, 'utf8'), {
    TELEGRAM_MODE: 'live',
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_OWNER_CHAT_ID: String(ownerId),
  }));

  await api.call('sendMessage', { chat_id: ownerId, text: '🟢 TIMBI OS est connecté à ce bot. Vous êtes enregistré comme propriétaire : vous seul pouvez approuver ou arrêter les agents.' });
  console.log('\n✅ os/.env mis à jour. Un message de confirmation vient d\'être envoyé sur Telegram.');
  console.log('   Étape suivante : npm start  (puis /status dans Telegram)');
}
