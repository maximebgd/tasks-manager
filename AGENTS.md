<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tasks Manager — guide projet

Gestionnaire de tâches façon « Notion » : tableau kanban (`/`), todo journalière (`/daily`), calendrier (`/calendar`), corbeille (`/trash`), fiche par tâche (`/task/[id]`).

## Stack

- **Next.js 16** (App Router, React 19, Turbopack) — voir l'avertissement ci-dessus.
- **Tailwind CSS v4** — config CSS-first dans `app/globals.css` (pas de `tailwind.config`).
- **TypeScript** strict.
- **PostgreSQL + Prisma 6** (⚠️ **pas la v7** : elle enlève `url` du schéma et impose des driver adapters + `prisma.config.ts`).
- **Docker** + `docker-compose.yml` (services `web` + `db`).

## Architecture (Next fullstack)

- **Lecture** : Server Components via `lib/data.ts` (`getTasks`, `getTrashedTasks`, `getTags`, `getDailyTodos`). `toTask()` y convertit les lignes Prisma vers les types UI (`null → undefined`, `Date → ISO`). Le `layout` et les pages sont `async`.
- **Écriture** : Server Actions dans `app/actions/*` :
  - `tasks.ts` — `createTaskAction`, `updateTaskAction`, `softDeleteTaskAction`, `restoreTaskAction`, `purgeTaskAction`, `reorderTasksAction`.
  - `daily.ts` — CRUD des todos journalières et des sous-tâches + réordonnancement.
  - `tags.ts` — `createTagAction`, `updateTagAction`, `deleteTagAction`.
- **État client** : trois providers montés dans le `layout`, **initialisés depuis la BDD** :
  - `TasksProvider` (`lib/tasks-context.tsx`, `useTasks()`) — board, peek (`task-peek.tsx`), fiche (`app/task/[id]`) et calendrier le consomment. `TaskBoard` ne prend **aucune prop**.
  - `TagsProvider` (`lib/tags-context.tsx`, `useTags()`) — les tags sont des **entités partagées**, pas des chaînes ; une tâche porte `tagIds: string[]` résolus via ce store.
  - `ToastProvider` (`lib/toast-context.tsx`, `useToast()`).
- **UI optimiste + rollback** : chaque mutation s'applique localement, puis persiste ; en cas d'échec → restauration de l'état + **toast**.
- **Corbeille (soft delete)** : `Task.deletedAt` ; `null` = active. La suppression met à la corbeille (`softDeleteTaskAction`), `/trash` permet de restaurer ou de purger définitivement.
- **Ordre (drag & drop)** : persisté via la colonne `position` ; les actions de réordonnancement renumérotent.
- **`lib/mock-data.ts`** ne sert plus qu'au **seed** (`prisma/seed.ts`), pas à l'app.

## Serveur MCP

Endpoint **Streamable HTTP** (`app/api/mcp/route.ts`) qui laisse un LLM externe (Claude Desktop, LM Studio, Ollama…) piloter l'app via le protocole MCP — pas de chat intégré, l'utilisateur apporte son client.

- **Techno** : `mcp-handler` embarqué dans un route handler Next (runtime `nodejs`, `force-dynamic`) ; SDK `@modelcontextprotocol/server`, schémas d'entrée en **zod**.
- **Outils** : définis dans `lib/mcp/tools.ts`, logique dans `lib/mcp/service.ts` (réutilise les lecteurs de `lib/data.ts` + Prisma, mêmes conventions de position/soft delete que les Server Actions). Périmètre **lecture + écriture complète** (tâches, tags, todos journalières). Les IDs sont générés par Prisma, pas fournis par le LLM.
- **Auth** : token statique `MCP_TOKEN` (`.env`) via `Authorization: Bearer`. Sans token → endpoint inactif (503).
- **Config** : page `/settings/mcp` (URL, token, snippet `mcp-remote` prêt à coller).
- **Doc des outils** : **source unique** = `lib/mcp/catalog.ts` (catalogue typé). Il alimente : la page in-app `/settings/mcp/tools` (rendu JSX), le fichier `docs/mcp-tools.md` (généré par `npm run docs:mcp`, ne pas éditer à la main) et les `description` des `registerTool`. En ajoutant/modifiant un outil → mettre à jour le catalogue puis relancer `npm run docs:mcp`.

## Conventions

- **Couleurs** : utiliser les **tokens sémantiques** (`bg-page`, `bg-surface`, `bg-surface-muted/hover`, `text-content`, `text-muted`, `text-faint`, `border-line`, `text-accent`, `tag-*`, `due-today`…) définis dans `globals.css`, **pas** la palette Tailwind brute. Le mode nuit est **piloté par la classe `.dark`** (`@custom-variant`) et bascule tout via variables CSS ; ne pas réintroduire de `dark:` ni de couleurs figées.
- **Tags** : 9 couleurs sémantiques (`TagColor` dans `lib/types.ts` : `gray|brown|orange|yellow|green|blue|purple|pink|red`), rendues via les tokens `tag-*`.
- **Dates** : passer par `lib/date.ts` (`todayISO`, `toISO`, `daysBetween`). « Aujourd'hui » est calculé **côté client** (date locale). Aucune date codée en dur.
- **Modèle de données** (`prisma/schema.prisma`) : `Task`, `Tag` (N-N implicite avec `Task`), `DailyTodo`, `SubTodo`. `dueDate`/`date` = chaînes ISO `"YYYY-MM-DD"` (stockées en `String`, pas `DateTime`).

## Workflow de dev

BDD dans Docker, app en local (hot reload, pas de rebuild) :

```bash
npm run db:up        # Postgres dans Docker (= docker compose up -d db)
npm run dev          # app en local — REQUIERT la BDD lancée + migrée
```

Scripts utiles : `db:migrate` (changement de schéma), `db:seed`, `db:studio`, `db:reset`, `db:down`, `db:generate`, `db:deploy` (migrations en prod).

Prod / « tout dans Docker » : `docker compose up --build`. Voir `README.md` pour les 3 modes (dev / prod-build / prod-pull via GHCR).

## Vérification

- Type-check : `npx tsc --noEmit`.
- **Ne pas lancer `next build`** juste pour vérifier — préférer le type-check et le serveur `dev`.
