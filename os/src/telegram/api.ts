/** Client minimal de l'API Bot Telegram. Le jeton ne quitte jamais ce module et n'est jamais journalisé. */
export class TelegramApi {
  #token: string;
  constructor(token: string) { this.#token = token; }

  async call<T = unknown>(method: string, body: Record<string, unknown>, timeoutMs = 40_000): Promise<T> {
    const res = await fetch(`https://api.telegram.org/bot${this.#token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = (await res.json()) as { ok: boolean; result: T; description?: string };
    if (!json.ok) throw new Error(`Telegram ${method} : ${json.description ?? res.status}`);
    return json.result;
  }
}
