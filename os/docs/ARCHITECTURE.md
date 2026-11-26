# TIMBI OS — Audit, prérequis, coûts et architecture

> Document de référence CTO · version MVP · 26/11/2026

## 1. Audit de l'existant

| Élément | Constat | Conséquence pour TIMBI OS |
|---|---|---|
| `timbiai.com` | Site statique (HTML/CSS/JS vanilla, WebGL, i18n EN/FR/TR), servi par GitHub Pages (`CNAME`) | Aucun backend existant : TIMBI OS est un système séparé. Le site ne doit **jamais** dépendre de TIMBI OS pour fonctionner. |
| Dépôt Git | Public, branche `main` déployée automatiquement | Le code de TIMBI OS ne doit pas être mélangé au site à terme → **migrer `os/` vers un dépôt privé `timbi-os`** avant toute donnée réelle. |
| Identité visuelle | Fond `#07070a`, typographie Plus Jakarta Sans. ⚠️ La variable CSS `--gold` du site vaut aujourd'hui `#ff6a2b` (orange), pas de l'or | Le dashboard utilise un vrai or (`#d4af37`). À trancher : réaligner le site sur l'or, ou assumer l'orange comme couleur d'accent. |
| Client Thiallou Services | Projet présent dans le portfolio uniquement | Enregistré comme projet dans TIMBI OS **sans aucune donnée personnelle** tant que les règles d'accès ne sont pas validées. |
| Outillage local | Node 26, npm 11, Git ; pas de Python | Stack Node/TypeScript, sans étape de build (Node exécute le TypeScript nativement). |

## 2. Choix d'architecture (et pourquoi)

### 2.1 Comment tournent les agents

| Option | Retenue pour | Raison |
|---|---|---|
| **API Messages + boucle d'agent maison** (SDK `@anthropic-ai/sdk`) | ATLAS, HUNTER, NEXUS, ECHO, CARE, LEDGER | Contrôle total *avant chaque appel* : budget, arrêt d'urgence, permissions, journal d'audit. Pas de coût d'exécution en plus des tokens. Mode simulé hors-ligne pour les tests. |
| **Claude Managed Agents** (Anthropic héberge la boucle et un conteneur isolé) | FORGE, GUARD (phase 3) | Ces agents doivent écrire et exécuter du code, ce qui demande un environnement isolé. C'est en bêta, la durée de session est facturée en plus des tokens, et l'historique est conservé jusqu'à suppression. |
| n8n | Intégrations « plomberie » (CRM, e-mail, webhooks Vercel/GitHub) | Les workflows sans raisonnement n'ont pas besoin d'un LLM. n8n appelle TIMBI OS via webhook signé, jamais l'inverse sans approbation. |

**Modèle par défaut :** `claude-opus-5-5` (4 $ / 20 $ par million de tokens en entrée / sortie), avec repli automatique côté serveur si le modèle refuse une requête. Le modèle est réglable par agent (`TIMBI_MODEL_HUNTER`…) : passer HUNTER sur Sonnet 5.5 ou Haiku 5.5 diviserait son coût par 2 à 40. **C'est votre décision**, à prendre après avoir mesuré la qualité.

### 2.2 Vue d'ensemble

```
                 ┌──────────────── Humain (propriétaire) ────────────────┐
                 │   Telegram (approbations, /stop)   Dashboard local     │
                 └───────────────┬───────────────────────────┬───────────┘
                                 │ décisions                 │ lecture + actions
                         ┌───────▼───────────────────────────▼────────┐
                         │                 TIMBI OS                   │
                         │  ┌──────── Noyau de sécurité ───────────┐  │
                         │  │ Arrêt d'urgence · Budget · Retries   │  │
                         │  │ Permissions RBAC · Portes d'approb.  │  │
                         │  │ Journal d'audit chaîné (SHA-256)     │  │
                         │  └──────────────────────────────────────┘  │
                         │   ATLAS ──délègue──► HUNTER   (MVP)        │
                         │     └─► NEXUS PIXEL FORGE ECHO CARE        │
                         │         LEDGER GUARD          (plus tard)  │
                         │   Planificateur · File de tâches           │
                         └───────┬───────────────────────────┬────────┘
                                 │                           │
                   Mémoire partagée + journaux     API Claude (Anthropic)
                   SQLite (bac à sable) → Supabase (Postgres + RLS)
```

### 2.3 Règles de sécurité imposées par le code (pas par le prompt)

1. **Les agents ne déclenchent jamais d'action externe eux-mêmes.** Un outil à risque (e-mail, WhatsApp, publication) crée une *demande d'approbation*. Seul l'exécuteur, après votre « ✅ » sur Telegram, peut agir. Dans le MVP, l'exécuteur est **simulé** : rien ne sort.
2. **Actions interdites aux agents :** signer un contrat, effectuer un paiement. L'outil n'existe pas ; la politique les bloque même si un agent tente de les demander.
3. **Budget :** plafonds par exécution, par jour et par mois, vérifiés avant chaque appel au modèle. Un modèle sans tarif connu est refusé. *En plus*, réglez une limite de dépenses dans la Console Anthropic : c'est le dernier filet de sécurité.
4. **Retries :** 2 essais automatiques par appel réseau (SDK), puis 2 nouvelles tentatives par tâche avec délai croissant, puis échec + notification. Après 5 échecs consécutifs, un disjoncteur déclenche l'arrêt d'urgence.
5. **Arrêt d'urgence :** `/stop` sur Telegram, bouton du dashboard, `npm run cli -- stop`, ou simple création d'un fichier `os/STOP` (fonctionne même si la base est cassée). Chaque itération d'agent le vérifie.
6. **Audit :** table en ajout seul (triggers qui interdisent modification et suppression), chaînée par hachage : toute altération est détectée par `npm run cli -- audit:verify`. Les champs ressemblant à des secrets sont masqués.
7. **Permissions :** chaque agent a une liste blanche d'outils, appliquée deux fois (outils proposés au modèle, puis contrôle à l'exécution). Côté humain, rôles `owner` / `admin` / `viewer` via la sécurité au niveau des lignes (RLS) de Supabase.
8. **Secrets :** uniquement dans `os/.env` (ignoré par Git) ou dans les variables d'environnement de l'hébergeur. Jamais dans le code ni dans la base.
9. **Production verrouillée :** `TIMBI_MODE=production` est refusé par le MVP. Le déverrouillage se fera après la phase 2 et une revue de sécurité.

## 3. Prérequis (à fournir seulement au moment voulu)

| Étape | Ce qu'il faut | Qui | Quand |
|---|---|---|---|
| A | Rien. Le MVP tourne en mode simulé (LLM simulé, Telegram simulé, données fictives) | — | **Maintenant** |
| B | Clé API Anthropic + limite de dépenses réglée dans la Console (ex. 30 $/mois) | Vous | Pour tester avec le vrai modèle |
| C | Bot Telegram via @BotFather (jeton) + votre identifiant de discussion Telegram | Vous | Pour les approbations sur téléphone |
| D | Projet Supabase **bac à sable** (distinct du futur projet de production) | Vous | Phase 2 |
| E | Dépôt GitHub privé `timbi-os`, puis Vercel (dashboard) et n8n | Vous | Phase 2–3 |

## 4. Estimation des coûts mensuels

Tarifs Claude ci-dessous à jour (novembre 2026). Les tarifs Supabase, Vercel et n8n sont **indicatifs, à vérifier sur leurs sites avant souscription**.

| Poste | Bac à sable (phase 1) | Opérationnel (phase 2–3) |
|---|---|---|
| API Claude — HUNTER (≈ 0,15–0,30 $ par recherche, 2 par jour) | 0 $ en mode simulé ; ≈ 5–10 $ en réel | ≈ 10–20 $ |
| API Claude — ATLAS (brief quotidien + délégations) | ≈ 2–5 $ | ≈ 5–15 $ |
| API Claude — autres agents (ECHO, NEXUS, CARE…) | — | ≈ 30–80 $ selon le volume |
| Supabase | Gratuit (le projet se met en pause s'il reste inactif) | Pro ≈ 25 $ |
| Vercel | Hobby gratuit (usage non commercial uniquement) | Pro ≈ 20 $ par membre (obligatoire pour un usage commercial) |
| n8n | — | Auto-hébergé sur un VPS ≈ 5–10 € ou n8n Cloud ≈ 20–25 € |
| Telegram, GitHub | Gratuit | Gratuit |
| **Total** | **≈ 0–15 $** | **≈ 90–170 $** |

Plafonds par défaut du MVP : **0,75 $ par exécution, 2 $ par jour, 30 $ par mois**.

## 5. Feuille de route

| Phase | Contenu | Critère de sortie |
|---|---|---|
| **1 — MVP (ce dépôt)** | ATLAS, HUNTER, approbations Telegram, noyau de sécurité, dashboard local, données fictives | Tests verts, une semaine de fonctionnement simulé puis réel sans incident |
| 2 — Fondations | Dépôt privé, Supabase (migration fournie), dashboard déployé sur Vercel avec authentification, NEXUS (propositions commerciales en brouillon) | RLS testée, sauvegardes actives |
| 3 — Production | FORGE + GUARD (Managed Agents, déploiements preview Vercel uniquement), ECHO, n8n | Toute publication passe par l'aperçu de GUARD + votre approbation |
| 4 — Opérations | CARE, LEDGER, PIXEL ; rapports hebdomadaires | Tableau des coûts par client |

## 6. Modèle de données (résumé)

`agents` · `projects` · `tasks` (statut, tentatives, résultat) · `runs` (une exécution d'agent) · `llm_calls` (tokens et coût par appel) · `memory` (mémoire partagée : globale, par agent, par projet) · `leads` · `approvals` · `audit_log` (ajout seul, chaîné) · `system_state` (arrêt d'urgence, disjoncteur, planificateur). Le schéma Postgres avec RLS est dans `supabase/migrations/0001_init.sql`.
