# TIMBI OS — MVP

Système d'exploitation interne de TIMBI AI : des agents IA opèrent, l'humain décide.
Ce MVP contient **ATLAS** (orchestrateur), **HUNTER** (prospection), le **workflow d'approbation Telegram**, le noyau de sécurité et un dashboard noir et or.

Architecture, coûts et feuille de route : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Démarrage (bac à sable, aucun compte requis)

```powershell
cd os
npm install
npm run setup        # crée .env (ignoré par Git) + jeton du dashboard
npm run hunt         # HUNTER cherche et qualifie des prospects fictifs
npm run atlas        # ATLAS délègue à HUNTER et vous fait un point
npm run cli -- approvals
npm run cli -- approve <id>   # exécution SIMULÉE : rien n'est envoyé
npm start            # planificateur + file de tâches + dashboard http://127.0.0.1:4747
npm test             # 13 tests : budget, arrêt d'urgence, permissions, audit, Telegram…
```

Par défaut, tout est simulé : modèle (`LLM_MODE=mock`), Telegram (messages écrits dans `data/telegram-outbox.log`) et données (`data/sandbox/companies.json`, entièrement fictif).

Dashboard : ouvrez `http://127.0.0.1:4747`, cliquez « Saisir le jeton » et collez `DASHBOARD_TOKEN` depuis `os/.env`. Sans jeton, le dashboard reste en lecture seule.

## Passer au vrai modèle Claude

1. Créez une clé API sur console.anthropic.com et **réglez une limite de dépenses dans la Console** (filet de sécurité indépendant du code).
2. Dans `os/.env` : `LLM_MODE=live` et `ANTHROPIC_API_KEY=...`
3. `npm run hunt`. Chaque appel est plafonné (0,75 $ par exécution, 2 $ par jour, 30 $ par mois par défaut). Les coûts simulés et réels sont comptés séparément.

## Brancher Telegram

1. Sur Telegram, écrivez à @BotFather → `/newbot` → copiez le jeton.
2. Écrivez un message à votre bot, puis récupérez votre identifiant via @userinfobot.
3. Dans `os/.env` : `TELEGRAM_MODE=live`, `TELEGRAM_BOT_TOKEN=...`, `TELEGRAM_OWNER_CHAT_ID=...`
4. `npm start`. Le bot ne répond qu'à votre identifiant. Commandes : `/status`, `/approvals`, `/hunt <brief>`, `/atlas <objectif>`, `/stop`, `/resume CONFIRMER`.

## Arrêt d'urgence (4 moyens)

`/stop` sur Telegram · bouton du dashboard · `npm run cli -- stop` · créer un fichier `os/STOP` (fonctionne même si la base est corrompue).

## Garanties imposées par le code

| Garantie | Où |
|---|---|
| Aucune action externe sans approbation ; exécuteurs simulés en bac à sable | `src/core/approvals.ts` |
| Contrats et paiements interdits aux agents | `ACTION_POLICY` |
| Budget vérifié avant chaque appel ; modèle sans tarif refusé | `src/core/budget.ts` |
| Limite d'itérations, nouvelles tentatives avec délai croissant, disjoncteur | `src/core/runner.ts`, `src/core/state.ts` |
| Liste blanche d'outils par agent, contrôlée deux fois | `src/agents/roster.ts`, `runner.ts` |
| Journal d'audit en ajout seul, chaîné SHA-256, secrets masqués | `src/core/audit.ts` |
| Anti-doublon des contacts prospects | `request_outreach_approval` |
| Mode production verrouillé | `src/config.ts` |
| Dashboard limité à 127.0.0.1, jeton pour toute action, protection DNS rebinding, aucun HTML injecté | `src/dashboard/` |

## Structure

```
os/
├── docs/ARCHITECTURE.md        audit, prérequis, coûts, architecture
├── supabase/migrations/        schéma Postgres + RLS (phase 2)
├── data/sandbox/               données fictives
├── src/
│   ├── agents/                 roster (9 agents, RBAC) + prompts ATLAS/HUNTER
│   ├── core/                   db, audit, budget, état, approbations, LLM, runner
│   ├── tools/                  outils des agents
│   ├── telegram/               API, notifications, bot propriétaire
│   ├── dashboard/              serveur local + interface
│   ├── cli.ts                  commandes
│   └── daemon.ts               planificateur (09:00 et 18:30, heure d'Istanbul) + file de tâches
└── test/
```
