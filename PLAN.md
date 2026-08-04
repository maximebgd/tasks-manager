# PLAN — Tasks Manager

Suivi du projet : d'abord le frontend, puis le backend (BDD) et l'empaquetage Docker.
`[x]` = fait · `[ ]` = à faire.

---

## Phase 1 — Frontend ✅

- [x] Refonte « Notion » : thème épuré, palette neutre via tokens sémantiques
- [x] Mode jour / nuit (toggle + persistance, sans flash au chargement)
- [x] Tableau (`/`) : filtres par tag
- [x] `/daily` : cocher une tâche en cliquant sur toute la ligne
- [x] `/daily` : réordonner les tâches en drag & drop
- [x] `/daily` : sous-tâches en puces cochables
- [x] `/daily` : réordonner les sous-tâches en drag & drop
- [x] `/calendar` : vue Mois **et** vue Semaine
- [x] `/` : aperçu au simple clic (peek) + fiche pleine page au double clic (`/task/[id]`)
- [x] Édition des tâches (titre, statut, priorité, échéance, tags, notes)
- [x] Commit du frontend (branche `feat/notion-frontend`)

## Phase 2 — Backend & Docker (scaffolding) ✅

- [x] Choix d'archi : Next.js fullstack + PostgreSQL + Prisma
- [x] Schéma Prisma (`Task`, `DailyTodo`, `SubTodo`) + migration initiale
- [x] Seed depuis les données de démo (`prisma/seed.ts`, idempotent)
- [x] `Dockerfile` (multi-stage) + `docker-compose.yml` (services `web` + `db`)
- [x] Scripts npm : `db:up`, `db:migrate`, `db:seed`, `db:studio`, `db:reset`…

## Phase 3 — Brancher le frontend à la BDD ✅ (code) / ⏳ (validation)

- [x] Lecture via Server Components (`lib/data.ts` : `getTasks`, `getDailyTodos`)
- [x] Écriture via Server Actions (`app/actions/tasks.ts`, `app/actions/daily.ts`)
- [x] Persistance optimiste (UI instantanée + sauvegarde en base)
- [x] Ordre du drag & drop persisté (colonne `position`)
- [x] Type-check complet OK (`tsc --noEmit`)
- [x] **Validation de bout en bout** (Docker BDD + app en local : fonctionne, persistance OK)
- [ ] Commit du branchement BDD (Server Actions + lecture serveur)

## Phase 4 — Finitions & robustesse 🚧

- [x] Gestion d'erreur des mutations : rollback de l'UI + toast d'erreur (au lieu d'un simple `console.error`)
- [x] Vraie date « aujourd'hui » (util `lib/date.ts`, plus de `2026-07-31` codé en dur)
- [ ] Faire refléter les éditions du tableau dans `/daily` / `/calendar` si besoin de cohérence temps réel
- [ ] (Optionnel) Authentification / multi-utilisateurs

## Phase 5 — Mise en production (tout dans Docker) ⬜

- [ ] Valider l'image de prod : `docker compose up --build` (frontend + backend + BDD)
- [ ] Variables d'environnement / secrets pour la prod
- [ ] Déploiement

---

### Boucle de dev au quotidien
```bash
npm run db:up    # Postgres dans Docker (si pas déjà lancé)
npm run dev      # l'app en local, branchée sur la BDD — http://localhost:3000
```

### Rappel : dev ≠ prod
- **Dev** : BDD dans Docker + app en local (hot reload, aucun rebuild).
- **Prod** : tout dans Docker via `docker compose up --build` (image buildée).
