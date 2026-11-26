import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { ROOT } from '../config.ts';
import { askHidden, upsertEnv } from '../telegram/setup.ts';

/** Saisie masquée de la clé API, vérification gratuite (liste des modèles), écriture dans os/.env. */
export async function llmSetup() {
  console.log('\n🔐 Configuration de la clé API Claude pour TIMBI OS');
  console.log("La clé est saisie ici, masquée, puis écrite uniquement dans os/.env (ignoré par Git).\n");

  const key = await askHidden('Collez la clé API (sk-ant-…) puis Entrée : ');
  if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key)) throw new Error("Ce n'est pas une clé API Anthropic valide (format sk-ant-…).");

  // Vérification sans coût : lister les modèles ne consomme aucun token.
  const client = new Anthropic({ apiKey: key, maxRetries: 1 });
  try {
    const model = await client.models.retrieve('claude-opus-5-5');
    console.log(`✅ Clé valide · accès à ${model.display_name}`);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error('Clé refusée par Anthropic. Vérifiez que vous avez copié la clé en entier.');
    if (e instanceof Anthropic.PermissionDeniedError) throw new Error("La clé est valide mais n'a pas accès à ce modèle.");
    if (e instanceof Anthropic.APIConnectionError) throw new Error('Impossible de joindre Anthropic (connexion internet ?).');
    throw e;
  }

  const envPath = path.join(ROOT, '.env');
  if (!existsSync(envPath)) copyFileSync(path.join(ROOT, '.env.example'), envPath);
  writeFileSync(envPath, upsertEnv(readFileSync(envPath, 'utf8'), { LLM_MODE: 'live', ANTHROPIC_API_KEY: key }));

  console.log('\n✅ os/.env mis à jour : LLM_MODE=live.');
  console.log('   Plafonds actifs : 0,75 $ par exécution · 2 $ par jour · 30 $ par mois (modifiables dans os/.env).');
  console.log('   Redémarrez TIMBI OS (Ctrl+C puis node src/daemon.ts) pour prendre la clé en compte.');
}
