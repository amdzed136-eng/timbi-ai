import { loadConfig, type Config } from './config.ts';
import { openDb } from './core/db.ts';
import { makeLlm } from './core/llm.ts';
import type { Deps } from './core/runner.ts';
import { makeNotifier } from './telegram/notifier.ts';

export function bootstrap(cfg: Config = loadConfig()): Deps {
  const db = openDb(cfg.dbPath);
  return { db, cfg, llm: makeLlm(cfg), notifier: makeNotifier(cfg) };
}
