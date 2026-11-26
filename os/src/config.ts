import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const envFile = path.join(ROOT, '.env');
if (existsSync(envFile) && !process.env.TIMBI_SKIP_ENV_FILE) process.loadEnvFile(envFile);

type Env = Record<string, string | undefined>;

function num(env: Env, name: string, def: number): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return def;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Configuration invalide : ${name}=${raw}`);
  return n;
}

function oneOf<T extends string>(env: Env, name: string, allowed: readonly T[], def: T): T {
  const raw = (env[name] ?? def) as T;
  if (!allowed.includes(raw)) throw new Error(`Configuration invalide : ${name} doit valoir ${allowed.join(' | ')}`);
  return raw;
}

export function loadConfig(env: Env = process.env) {
  const mode = oneOf(env, 'TIMBI_MODE', ['sandbox', 'production'] as const, 'sandbox');
  if (mode === 'production') {
    throw new Error('TIMBI_MODE=production est verrouillé dans le MVP. Voir docs/ARCHITECTURE.md §2.3.');
  }
  const llmMode = oneOf(env, 'LLM_MODE', ['mock', 'live'] as const, 'mock');
  const telegramMode = oneOf(env, 'TELEGRAM_MODE', ['mock', 'live'] as const, 'mock');
  const defaultModel = env.TIMBI_MODEL || 'claude-opus-5-5';

  const cfg = {
    mode,
    llmMode,
    models: {
      atlas: env.TIMBI_MODEL_ATLAS || defaultModel,
      hunter: env.TIMBI_MODEL_HUNTER || defaultModel,
    } as Record<string, string>,
    budget: {
      perRunUsd: num(env, 'BUDGET_PER_RUN_USD', 0.75),
      dailyUsd: num(env, 'BUDGET_DAILY_USD', 2),
      monthlyUsd: num(env, 'BUDGET_MONTHLY_USD', 30),
      reserveUsd: num(env, 'BUDGET_RESERVE_USD', 0.1),
    },
    limits: {
      maxIterations: num(env, 'MAX_AGENT_ITERATIONS', 12),
      maxTaskAttempts: num(env, 'MAX_TASK_ATTEMPTS', 3),
      circuitBreakerErrors: num(env, 'CIRCUIT_BREAKER_ERRORS', 5),
      approvalTtlHours: num(env, 'APPROVAL_TTL_HOURS', 24),
      maxDelegationDepth: 1,
      maxOutputTokens: 8000,
    },
    telegram: {
      mode: telegramMode,
      token: env.TELEGRAM_BOT_TOKEN ?? '',
      ownerChatId: env.TELEGRAM_OWNER_CHAT_ID ?? '',
    },
    dashboard: {
      port: num(env, 'DASHBOARD_PORT', 4747),
      token: env.DASHBOARD_TOKEN ?? '',
    },
    dbPath: path.resolve(ROOT, env.DB_PATH || 'data/timbi-sandbox.db'),
    stopFile: path.join(ROOT, 'STOP'),
    sandboxDataDir: path.join(ROOT, 'data', 'sandbox'),
    outboxPath: path.join(ROOT, 'data', 'telegram-outbox.log'),
  };

  if (telegramMode === 'live' && (!cfg.telegram.token || !cfg.telegram.ownerChatId)) {
    throw new Error('TELEGRAM_MODE=live exige TELEGRAM_BOT_TOKEN et TELEGRAM_OWNER_CHAT_ID dans .env');
  }
  return cfg;
}

export type Config = ReturnType<typeof loadConfig>;
