# Tasks Manager

<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/🇬🇧_English-555555?style=for-the-badge" alt="English"></a>
  &nbsp;
  <a href="./README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-2ea44f?style=for-the-badge" alt="Français"></a>
</p>

Gestionnaire de tâches full-stack façon « Notion » : un tableau kanban, une todo journalière, un calendrier et une corbeille, avec des notes en Markdown et un mode jour/nuit.

Construit avec **Next.js 16** en full-stack (App Router) : la **lecture** passe par des Server Components, l'**écriture** par des Server Actions, et l'état client est **optimiste avec rollback** (mise à jour instantanée de l'UI, restauration + toast en cas d'échec). La persistance est assurée par **Prisma 6 + PostgreSQL**, le tout conteneurisé (**Docker**, images publiées sur GHCR). Il embarque aussi un **serveur MCP**, pour qu'un LLM externe (Claude Desktop, LM Studio, Ollama…) puisse lire et piloter l'app.

> 💡 **Pourquoi ce projet ?** Je l'ai développé et utilisé pendant mon stage pour m'organiser. Je n'avais pas le droit d'utiliser des outils comme Notion pour des raisons de sécurité et de confidentialité — j'ai donc construit le mien, auto-hébergeable et sous mon contrôle.

![Tasks Manager screenshot](public/screenshot.png)

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16 (App Router, React 19), TypeScript strict, Tailwind CSS v4 |
| Backend | Next.js Server Actions (écriture) + Server Components (lecture) |
| ORM / BDD | Prisma 6 + PostgreSQL 16 |
| Contenu | react-markdown + remark-gfm (notes en Markdown) |
| IA / MCP | Serveur MCP embarqué (`mcp-handler` + `@modelcontextprotocol/server`) exposant les tâches à un LLM externe |
| Conteneurisation | Docker + docker-compose (services `web` + `db`), CI de publication GHCR |

## Structure

```
tasks-manager/
├── app/
│   ├── actions/
│   │   ├── tasks.ts             # Server Actions tâches (create/update/soft-delete/restore/purge/reorder)
│   │   ├── daily.ts             # Server Actions todo journalière + sous-tâches
│   │   └── tags.ts              # Server Actions étiquettes (create/update/delete)
│   ├── components/
│   │   ├── task-board.tsx       # Tableau kanban (aucune prop, lit useTasks())
│   │   ├── task-card.tsx        # Carte de tâche (drag & drop)
│   │   ├── task-peek.tsx        # Aperçu latéral au simple clic
│   │   ├── task-editor.tsx      # Édition (titre, statut, priorité, échéance, tags, notes)
│   │   ├── daily-todo.tsx       # Liste journalière + sous-tâches cochables
│   │   ├── calendar.tsx         # Vues Mois et Semaine
│   │   ├── trash.tsx            # Corbeille (restaurer / purger)
│   │   ├── tag-picker.tsx       # Sélecteur d'étiquettes (9 couleurs)
│   │   ├── markdown.tsx         # Rendu Markdown des notes
│   │   ├── nav.tsx / theme-toggle.tsx / badges.tsx / add-task-form.tsx
│   ├── task/[id]/page.tsx       # Fiche pleine page d'une tâche
│   ├── page.tsx                 # Tableau (/)
│   ├── daily/page.tsx           # Todo journalière (/daily)
│   ├── calendar/page.tsx        # Calendrier (/calendar)
│   ├── trash/page.tsx           # Corbeille (/trash)
│   ├── api/mcp/route.ts         # Endpoint MCP (Streamable HTTP) — accès LLM externe
│   ├── settings/mcp/page.tsx    # Page de config MCP (URL, token, snippet client)
│   ├── layout.tsx               # Providers (Tasks / Tags / Toast) initialisés depuis la BDD
│   └── globals.css              # Tailwind v4 + tokens sémantiques + mode nuit (.dark)
├── lib/
│   ├── data.ts                 # Lectures serveur (getTasks, getTrashedTasks, getTags, getDailyTodos)
│   ├── mcp/                    # Serveur MCP — tools.ts (déf. des outils) + service.ts (logique BDD)
│   ├── tasks-context.tsx       # Store client des tâches (useTasks) — optimiste + rollback
│   ├── tags-context.tsx        # Store client des étiquettes (useTags)
│   ├── toast-context.tsx       # Notifications (useToast)
│   ├── prisma.ts               # Client Prisma (singleton)
│   ├── types.ts                # Types UI (Task, Tag, DailyTodo, SubTodo, Status, Priority)
│   ├── date.ts                 # Helpers ISO (todayISO, toISO, daysBetween)
│   └── mock-data.ts            # Données de démo — uniquement pour le seed
├── prisma/
│   ├── schema.prisma           # Task, Tag, DailyTodo, SubTodo
│   ├── migrations/             # init → soft-delete → table des tags
│   └── seed.ts                 # Seed idempotent depuis mock-data
├── docker-compose.yml          # Dev (db seul) / build soi-même (web local + db)
├── docker-compose.prod.yml     # Prod pull (web GHCR + db Docker Hub)
├── Dockerfile                  # Image web (multi-stage)
└── .github/workflows/docker-publish.yml   # CI : build multi-arch + push GHCR
```

## Fonctionnalités

- **Tableau kanban (`/`)** — trois colonnes (À faire / En cours / Terminé), réordonnancement en drag & drop (persisté via `position`), filtres par étiquette, priorités et échéances.
- **Aperçu & fiche** — simple clic = aperçu latéral (peek), double clic = fiche pleine page (`/task/[id]`). Board, peek et fiche partagent le **même store** (`useTasks`).
- **Todo journalière (`/daily`)** — une liste par jour, cocher une tâche en cliquant sur toute la ligne, sous-tâches cochables, réordonnancement en drag & drop.
- **Calendrier (`/calendar`)** — vues **Mois** et **Semaine**.
- **Étiquettes** — entités réutilisables partagées entre tâches, 9 couleurs sémantiques (façon Notion), création / renommage / suppression.
- **Corbeille (`/trash`)** — suppression douce (`deletedAt`) : restaurer une tâche ou la **purger** définitivement.
- **Notes en Markdown** — édition et rendu (react-markdown + remark-gfm) sur la fiche de tâche.
- **Mode jour / nuit** — bascule sans flash au chargement, piloté par la classe `.dark` et des tokens CSS sémantiques.
- **UI optimiste** — chaque mutation s'applique instantanément puis persiste ; en cas d'échec, l'état est restauré et un **toast** d'erreur s'affiche.
- **Serveur MCP (optionnel)** — connecte ton propre LLM (Claude Desktop, LM Studio, Ollama…) via l'endpoint `/api/mcp` pour lire et modifier tâches, étiquettes et todos journalières. Configuration sur la page `/settings/mcp`.

## Variables d'environnement

Copier `.env.example` en `.env` pour le dev local. En Docker, la valeur est fournie par `docker-compose.yml`.

| Variable | Défaut | Description |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_DB` | `tasks` | Utilisateur / base Postgres (lus par `docker-compose`). |
| `POSTGRES_PASSWORD` | `tasks` | **À changer.** Ne garde pas la valeur par défaut, même en local — mets un vrai secret. |
| `DATABASE_URL` | `postgresql://tasks:tasks@localhost:5432/tasks?schema=public` | **Requis.** Chaîne de connexion PostgreSQL (garde-la alignée sur les `POSTGRES_*` ci-dessus). |
| `MCP_TOKEN` | _(vide)_ | Token d'accès de l'endpoint MCP (`/api/mcp`). Sans lui, l'endpoint reste inactif. Génère-le avec `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

> **Sécurité / modèle de menace.** L'app n'a **aucune authentification intégrée** : quiconque atteint le port `3000` a un accès lecture/écriture complet à tes tâches. Elle est conçue pour tourner **localement sur une seule machine**, donc les deux fichiers Compose exposent leurs ports sur `127.0.0.1` (boucle locale) — app et BDD ne sont jamais joignables depuis le LAN. Pour l'exposer volontairement sur le réseau, remplace `127.0.0.1:3000:3000` par `3000:3000` dans `docker-compose.yml`, et ajoute ton propre contrôle d'accès devant.

## Les 3 modes de lancement

L'app tourne en **2 conteneurs** : `web` (Next, full-stack) et `db` (Postgres 16). Postgres est toujours **pullé** (image officielle) ; seul `web` a un `Dockerfile`. Les migrations Prisma sont appliquées au démarrage de `web` (`prisma migrate deploy`).

| Mode | Front | BDD | Code source | Fichier |
|---|---|---|---|---|
| **1. Dev** | local (`npm run dev`) | Docker (pull) | requis | `docker-compose.yml` (db seul) |
| **2. Build soi-même** | Docker (**build** → `local/tasks-manager`) | Docker (pull) | **requis** | `docker-compose.yml` |
| **3. Pull depuis GHCR** | Docker (**pull** GHCR → `ghcr.io/maximebgd/tasks-manager`) | Docker (pull) | non requis | `docker-compose.prod.yml` |

Il y a en fait **deux façons** de le lancer avec Docker :

- **Pull depuis GHCR** (mode 3) — le code source n'est **pas obligatoire** : les deux images (`web` depuis GHCR + `db` depuis Docker Hub) suffisent. Idéal pour simplement déployer et lancer.
- **Build soi-même** (mode 2) — le code source **est obligatoire** : Compose build l'image `web` localement. C'est le mode à utiliser pour **ajouter tes propres fonctionnalités** au projet.

### 1. Dev — front local + BDD dans Docker

Le mode à utiliser **quand on développe l'app** : le front tourne en local, donc les modifications s'affichent **en temps réel** (hot reload, aucun rebuild). Modèle recommandé : **BDD dans Docker, app en local**. Seule la BDD tourne dans Docker.

```bash
npm install

npm run db:up        # Postgres dans Docker (= docker compose up -d db)
npm run db:migrate   # applique les migrations Prisma (1re fois)
npm run db:seed      # (optionnel) données de démo

npm run dev          # app en local — http://localhost:3000
```

Scripts utiles : `db:seed` (données de test), `db:clear` (vide la BDD), `db:reset` (vide + reseed), `db:studio` (Prisma Studio), `db:down` (arrête la BDD), `db:generate` (client Prisma), `db:deploy` (migrations en prod).

> ⚠️ **Vérification** : type-check avec `npx tsc --noEmit`. Éviter `next build` juste pour vérifier — préférer le serveur `dev`.

### 2. Build soi-même — compose *build* le front + *pull* la BDD

Nécessite le **code source**. L'image `web` est buildée localement (taguée `local/tasks-manager`) et Postgres est pullé. C'est le mode à utiliser pour **ajouter tes propres fonctionnalités** au projet.

```bash
docker compose up --build -d   # build l'image web + démarre (rebuild après un changement de code)
docker compose down            # arrête (ajouter -v pour supprimer aussi le volume BDD)
```

> **Tag de version (optionnel)** — l'image locale s'appelle `local/tasks-manager:${TAG:-latest}` : **sans `TAG`, c'est `latest`**. Pour builder une version épinglée :
> ```bash
> TAG=1.0.0 docker compose build           # → local/tasks-manager:1.0.0
> docker tag local/tasks-manager:1.0.0 local/tasks-manager:latest   # garde latest aligné
> TAG=1.0.0 docker compose up -d           # lance cette version précise
> ```

> **Données de démo (optionnel)** — une fois les conteneurs lancés, seed la BDD depuis le conteneur `web` :
> ```bash
> docker compose exec web npm run db:seed
> ```

### 3. Pull depuis GHCR — compose *pull* le front + *pull* la BDD

**Aucun code source requis** : les deux images viennent des registres (`web` depuis GHCR, `db` depuis Docker Hub). Il suffit de déployer et lancer.

```bash
docker compose -f docker-compose.prod.yml up -d --pull always   # pull les deux images + démarre
docker compose -f docker-compose.prod.yml down                  # arrête (ajouter -v pour supprimer aussi le volume BDD)
# TAG épingle une version (défaut : latest). Ex. :
TAG=1.0.0 docker compose -f docker-compose.prod.yml up -d --pull always
```

> **Données de démo (optionnel)** — une fois les conteneurs lancés, seed la BDD depuis le conteneur `web` :
> ```bash
> docker compose -f docker-compose.prod.yml exec web npm run db:seed
> ```

> L'image `web` publiée sur GHCR est **publique** : aucun `docker login` n'est nécessaire pour la pull.

### Publier une version

La CI (`.github/workflows/docker-publish.yml`) build l'image `web` en multi-arch (amd64 + arm64) et la pousse sur GHCR :

- à chaque push sur `main` → `:latest` (+ `:main`, `:sha-…`)
- à chaque tag git `v*` → les tags semver **et** `:latest`

Pour publier une version, tague un commit de `main` et pousse le tag :

```bash
git tag v1.0.0
git push origin v1.0.0
```

Ça publie `ghcr.io/maximebgd/tasks-manager:1.0.0`, `:1.0` et `:latest` — **la même image**. Pull une version **figée** avec `:1.0.0` (ne bouge jamais), ou le `:latest` **mouvant** pour la dernière version.

## Architecture (Next full-stack)

- **Lecture** — `lib/data.ts` expose `getTasks`, `getTrashedTasks`, `getTags`, `getDailyTodos`, appelées depuis des **Server Components** (`layout` et pages `async`). `toTask()` convertit les lignes Prisma vers les types UI.
- **Écriture** — **Server Actions** dans `app/actions/*` :
  - `tasks.ts` — `createTaskAction`, `updateTaskAction`, `softDeleteTaskAction`, `restoreTaskAction`, `purgeTaskAction`, `reorderTasksAction`.
  - `daily.ts` — CRUD des todos journalières et des sous-tâches + réordonnancement.
  - `tags.ts` — `createTagAction`, `updateTagAction`, `deleteTagAction`.
- **État client** — trois providers montés dans le `layout`, **initialisés depuis la BDD** : `TasksProvider` (`useTasks`), `TagsProvider` (`useTags`), `ToastProvider` (`useToast`). `TaskBoard` ne prend **aucune prop**.
- **Optimiste + rollback** — chaque mutation s'applique localement, puis persiste ; en cas d'échec → restauration de l'état + toast.

### Modèle de données (`prisma/schema.prisma`)

| Modèle | Rôle |
|---|---|
| `Task` | Tâche du tableau : `title`, `description`, `status`, `priority`, `dueDate` (ISO `YYYY-MM-DD`), `notes`, `position` (ordre), `deletedAt` (corbeille), relation N-N avec `Tag` |
| `Tag` | Étiquette réutilisable : `name` (unique), `color` (clé sémantique) |
| `DailyTodo` | Élément de la todo journalière : `date` (ISO), `title`, `done`, `position` |
| `SubTodo` | Sous-tâche cochable rattachée à un `DailyTodo` (cascade à la suppression) |

## Serveur MCP

Un endpoint **MCP** (Model Context Protocol) optionnel permet de connecter ton propre LLM — local ou cloud (Claude Desktop, LM Studio, Ollama…) — pour qu'il lise et modifie tes tâches. Aucun chat intégré : tu apportes ton propre client MCP.

- **Endpoint** — `app/api/mcp/route.ts`, Streamable HTTP, servi par l'app Next elle-même (un seul déploiement, réutilise le singleton Prisma). Construit avec `mcp-handler` + `@modelcontextprotocol/server`, schémas d'entrée en zod.
- **Outils** — définis dans `lib/mcp/tools.ts` (logique dans `lib/mcp/service.ts`, réutilise les lecteurs de `lib/data.ts` + Prisma). Périmètre **lecture + écriture complète** : tâches (lister / rechercher / détail / créer / modifier / corbeille / restaurer / purger), étiquettes (CRUD) et todos journalières (créer / cocher / sous-tâches / corbeille). Les IDs sont générés par Prisma, pas par le LLM. Voir la **[référence des outils](./docs/mcp-tools.md)**.
- **Auth** — token statique `MCP_TOKEN` via `Authorization: Bearer`. Sans token, l'endpoint reste inactif (503).
- **Configuration** — ouvre `/settings/mcp` pour l'URL de l'endpoint, le token et un snippet client prêt à coller (via le pont `mcp-remote`, qui relaie le transport HTTP + l'en-tête d'authentification) :

```json
{
  "mcpServers": {
    "tasks-manager": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/api/mcp",
               "--header", "Authorization: Bearer <ton-token>"]
    }
  }
}
```

## Schéma

```mermaid
flowchart TD
    subgraph CLIENT["🖥️ Client (Composants React)"]
        direction TB
        U1([Tableau / Daily / Calendrier / Corbeille])
        U2([Aperçu peek + fiche /task/&#91;id&#93;])
        CTX["Stores client (Context)\n─────────────────\nuseTasks · useTags · useToast\nUI optimiste + rollback"]
    end

    subgraph SERVER["⚙️ Serveur Next.js (App Router)"]
        direction TB
        RC["Server Components — lecture\n─────────────────\nlib/data.ts\ngetTasks · getTrashedTasks\ngetTags · getDailyTodos"]
        SA["Server Actions — écriture\n─────────────────\napp/actions/*\ntasks · daily · tags"]
        MCP["Serveur MCP — Streamable HTTP\n─────────────────\napp/api/mcp · lib/mcp/*\ntools + service (lecture/écriture)"]
    end

    LLM([Client LLM externe\nClaude Desktop · LM Studio · Ollama])

    subgraph DATA["🗄️ Persistance"]
        direction TB
        PR["Prisma 6\n─────────────────\nlib/prisma.ts (singleton)\nschema.prisma"]
        DB[("PostgreSQL 16\nTask · Tag · DailyTodo · SubTodo")]
    end

    %% Initialisation (lecture)
    RC -->|"props initiales"| CTX
    RC -->|"findMany"| PR

    %% Rendu
    CTX --> U1
    CTX --> U2

    %% Mutations (écriture optimiste)
    U1 -->|"mutation"| CTX
    U2 -->|"mutation"| CTX
    CTX -.->|"applique en local puis appelle"| SA
    SA -->|"create / update / delete"| PR
    SA -.->|"échec → rollback + toast"| CTX

    %% MCP (LLM externe)
    LLM -->|"MCP · token Bearer"| MCP
    MCP -->|"lecture / écriture"| PR

    PR <--> DB

    %% Styles
    style CLIENT fill:#1e293b,color:#e2e8f0,stroke:#3b82f6
    style SERVER fill:#0f172a,color:#e2e8f0,stroke:#10b981
    style DATA fill:#1c1917,color:#fde68a,stroke:#f59e0b
    style LLM fill:#2e1065,color:#e9d5ff,stroke:#a855f7
```
