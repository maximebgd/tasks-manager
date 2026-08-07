# Tasks Manager

<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/🇬🇧_English-2ea44f?style=for-the-badge" alt="English"></a>
  &nbsp;
  <a href="./README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-555555?style=for-the-badge" alt="Français"></a>
</p>

A full-stack, Notion-style task manager: a kanban board, a daily to-do list, a calendar and a trash bin, with Markdown notes and a light/dark theme.

Built with **Next.js 16** as a full-stack app (App Router): **reads** go through Server Components, **writes** through Server Actions, and client state is **optimistic with rollback** (the UI updates instantly, then restores state + shows a toast on failure). Persistence is handled by **Prisma 6 + PostgreSQL**, all containerized (**Docker**, images published to GHCR).

> 💡 **Why this project?** I built and used it during my internship to stay organized. I wasn't allowed to use tools like Notion for security and confidentiality reasons — so I built my own, self-hostable and fully under my control.

![Tasks Manager screenshot](public/screenshot.png)

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, React 19), strict TypeScript, Tailwind CSS v4 |
| Backend | Next.js Server Actions (writes) + Server Components (reads) |
| ORM / DB | Prisma 6 + PostgreSQL 16 |
| Content | react-markdown + remark-gfm (Markdown notes) |
| AI / MCP | Embedded MCP server (`mcp-handler` + `@modelcontextprotocol/server`) exposing tasks to an external LLM |
| Containerization | Docker + docker-compose (`web` + `db` services), GHCR publish CI |

## Structure

```
tasks-manager/
├── app/
│   ├── actions/
│   │   ├── tasks.ts             # Task Server Actions (create/update/soft-delete/restore/purge/reorder)
│   │   ├── daily.ts             # Daily to-do + subtasks Server Actions
│   │   └── tags.ts              # Tag Server Actions (create/update/delete)
│   ├── components/
│   │   ├── task-board.tsx       # Kanban board (no props, reads useTasks())
│   │   ├── task-card.tsx        # Task card (drag & drop)
│   │   ├── task-peek.tsx        # Side peek on single click
│   │   ├── task-editor.tsx      # Editing (title, status, priority, due date, tags, notes)
│   │   ├── daily-todo.tsx       # Daily list + checkable subtasks
│   │   ├── calendar.tsx         # Month and Week views
│   │   ├── trash.tsx            # Trash (restore / purge)
│   │   ├── tag-picker.tsx       # Tag picker (9 colors)
│   │   ├── markdown.tsx         # Markdown rendering for notes
│   │   ├── nav.tsx / theme-toggle.tsx / badges.tsx / add-task-form.tsx
│   ├── task/[id]/page.tsx       # Full-page task detail
│   ├── page.tsx                 # Board (/)
│   ├── daily/page.tsx           # Daily to-do (/daily)
│   ├── calendar/page.tsx        # Calendar (/calendar)
│   ├── trash/page.tsx           # Trash (/trash)
│   ├── api/mcp/route.ts         # MCP endpoint (Streamable HTTP) — external LLM access
│   ├── settings/mcp/page.tsx    # MCP config page (endpoint URL, token, client snippet)
│   ├── layout.tsx               # Providers (Tasks / Tags / Toast) initialized from the DB
│   └── globals.css              # Tailwind v4 + semantic tokens + dark mode (.dark)
├── lib/
│   ├── data.ts                 # Server reads (getTasks, getTrashedTasks, getTags, getDailyTodos)
│   ├── mcp/                    # MCP server — tools.ts (tool defs) + service.ts (DB logic)
│   ├── tasks-context.tsx       # Client task store (useTasks) — optimistic + rollback
│   ├── tags-context.tsx        # Client tag store (useTags)
│   ├── toast-context.tsx       # Notifications (useToast)
│   ├── prisma.ts               # Prisma client (singleton)
│   ├── types.ts                # UI types (Task, Tag, DailyTodo, SubTodo, Status, Priority)
│   ├── date.ts                 # ISO helpers (todayISO, toISO, daysBetween)
│   └── mock-data.ts            # Demo data — used only for seeding
├── prisma/
│   ├── schema.prisma           # Task, Tag, DailyTodo, SubTodo
│   ├── migrations/             # init → soft-delete → tags table
│   └── seed.ts                 # Idempotent seed from mock-data
├── docker-compose.yml          # Dev (db only) / Prod build (web + db)
├── docker-compose.prod.yml     # Prod pull (web from GHCR + db from Docker Hub)
├── Dockerfile                  # web image (multi-stage)
└── .github/workflows/docker-publish.yml   # CI: multi-arch build + push to GHCR
```

## Features

- **Kanban board (`/`)** — three columns (To do / In progress / Done), drag-and-drop reordering (persisted via `position`), filtering by tag, priorities and due dates.
- **Peek & detail** — single click = side peek, double click = full-page detail (`/task/[id]`). Board, peek and detail share the **same store** (`useTasks`).
- **Daily to-do (`/daily`)** — one list per day, check a task by clicking anywhere on its row, checkable subtasks, drag-and-drop reordering.
- **Calendar (`/calendar`)** — **Month** and **Week** views.
- **Tags** — reusable entities shared across tasks, 9 semantic colors (Notion-style), create / rename / delete.
- **Trash (`/trash`)** — soft delete (`deletedAt`): restore a task or **purge** it permanently.
- **Markdown notes** — editing and rendering (react-markdown + remark-gfm) on the task detail page.
- **Light / dark mode** — no flash on load, driven by the `.dark` class and semantic CSS tokens.
- **Optimistic UI** — each mutation applies instantly then persists; on failure, state is restored and an error **toast** is shown.
- **MCP server (optional)** — connect your own LLM (Claude Desktop, LM Studio, Ollama…) through the `/api/mcp` endpoint to read and edit tasks, tags and daily to-dos. Setup on the `/settings/mcp` page.

## Getting started

Recommended dev setup: **DB in Docker, app running locally** (hot reload, no rebuild).

```bash
npm install

npm run db:up        # Postgres in Docker (= docker compose up -d db)
npm run db:migrate   # apply Prisma migrations (first time)
npm run db:seed      # (optional) demo data

npm run dev          # app locally — http://localhost:3000
```

Handy scripts: `db:studio` (Prisma Studio), `db:reset` (reset + reseed), `db:down` (stop the DB), `db:generate` (Prisma client), `db:deploy` (migrations in prod).

> ⚠️ **Verifying**: type-check with `npx tsc --noEmit`. Avoid `next build` just to verify — prefer the `dev` server.

## Environment variables

Copy `.env.example` to `.env` for local dev. In Docker, the value is provided by `docker-compose.yml`.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://tasks:tasks@localhost:5432/tasks?schema=public` | **Required.** PostgreSQL connection string |
| `MCP_TOKEN` | _(empty)_ | Access token for the MCP endpoint (`/api/mcp`). Without it, the endpoint stays disabled. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

## Architecture (Next full-stack)

- **Reads** — `lib/data.ts` exposes `getTasks`, `getTrashedTasks`, `getTags`, `getDailyTodos`, called from **Server Components** (`layout` and `async` pages). `toTask()` converts Prisma rows to UI types.
- **Writes** — **Server Actions** in `app/actions/*`:
  - `tasks.ts` — `createTaskAction`, `updateTaskAction`, `softDeleteTaskAction`, `restoreTaskAction`, `purgeTaskAction`, `reorderTasksAction`.
  - `daily.ts` — CRUD for daily to-dos and subtasks + reordering.
  - `tags.ts` — `createTagAction`, `updateTagAction`, `deleteTagAction`.
- **Client state** — three providers mounted in `layout`, **initialized from the DB**: `TasksProvider` (`useTasks`), `TagsProvider` (`useTags`), `ToastProvider` (`useToast`). `TaskBoard` takes **no props**.
- **Optimistic + rollback** — each mutation applies locally, then persists; on failure → state restore + toast.

### Data model (`prisma/schema.prisma`)

| Model | Role |
|---|---|
| `Task` | Board task: `title`, `description`, `status`, `priority`, `dueDate` (ISO `YYYY-MM-DD`), `notes`, `position` (order), `deletedAt` (trash), N-N relation with `Tag` |
| `Tag` | Reusable label: `name` (unique), `color` (semantic key) |
| `DailyTodo` | Daily to-do item: `date` (ISO), `title`, `done`, `position` |
| `SubTodo` | Checkable subtask attached to a `DailyTodo` (cascade on delete) |

## MCP server

An optional **MCP** (Model Context Protocol) endpoint lets you connect your own LLM — local or cloud (Claude Desktop, LM Studio, Ollama…) — so it can read and edit your tasks. There is no built-in chat: you bring your own MCP client.

- **Endpoint** — `app/api/mcp/route.ts`, Streamable HTTP, served by the Next app itself (single deployment, reuses the Prisma singleton). Built with `mcp-handler` + `@modelcontextprotocol/server`, input schemas in zod.
- **Tools** — defined in `lib/mcp/tools.ts` (logic in `lib/mcp/service.ts`, reusing `lib/data.ts` readers + Prisma). **Full read + write** scope: tasks (list / search / get / create / update / trash / restore / purge), tags (CRUD) and daily to-dos (create / check / subtasks / trash). IDs are generated by Prisma, not by the LLM. See the full **[tool reference](./docs/mcp-tools.md)**.
- **Auth** — static `MCP_TOKEN` via `Authorization: Bearer`. Without a token the endpoint stays disabled (503).
- **Setup** — open `/settings/mcp` for the endpoint URL, the token and a ready-to-paste client snippet (via the `mcp-remote` bridge, which relays HTTP transport + the auth header):

```json
{
  "mcpServers": {
    "tasks-manager": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/api/mcp",
               "--header", "Authorization: Bearer <your-token>"]
    }
  }
}
```

## The 3 launch modes

The app runs as **2 containers**: `web` (Next, full-stack) and `db` (Postgres 16). Postgres is always **pulled** (official image); only `web` has a `Dockerfile`. Prisma migrations are applied when `web` starts (`prisma migrate deploy`).

| Mode | Front | DB | File |
|---|---|---|---|
| **1. Dev** | local (`npm run dev`) | Docker (pull) | `docker-compose.yml` (db only) |
| **2. Prod (build)** | Docker (**build**) | Docker (pull) | `docker-compose.yml` |
| **3. Prod (pull)** | Docker (**pull** GHCR) | Docker (pull) | `docker-compose.prod.yml` |

### 1. Dev — front local + DB in Docker

Hot reload on the machine; only the DB runs in Docker. (See [Getting started](#getting-started) for the first run: install, migrations, seed.)

```bash
npm run db:up   # Postgres in Docker (db service only)
npm run dev     # front locally — http://localhost:3000
```

### 2. Prod (build) — compose *builds* the front + *pulls* the DB

On a machine that has the source code: the `web` image is built locally, Postgres is pulled.

```bash
docker compose up --build -d
```

### 3. Prod (pull) — compose *pulls* the front + *pulls* the DB

On a server **without the source code**: both images come from registries (`web` from GHCR, `db` from Docker Hub).

```bash
docker compose -f docker-compose.prod.yml up -d
# TAG pins a version (default: latest)
TAG=1.2.3 docker compose -f docker-compose.prod.yml up -d
```

> The `web` image published on GHCR is **public**: no `docker login` is needed to pull it.

The CI (`.github/workflows/docker-publish.yml`) builds the `web` image multi-arch (amd64 + arm64) and pushes it to GHCR on every push to `main` (`:latest`) and every `v*` tag (`:1.2.3`).

## Schema

```mermaid
flowchart TD
    subgraph CLIENT["🖥️ Client (React components)"]
        direction TB
        U1([Board / Daily / Calendar / Trash])
        U2([Peek + detail /task/&#91;id&#93;])
        CTX["Client stores (Context)\n─────────────────\nuseTasks · useTags · useToast\nOptimistic UI + rollback"]
    end

    subgraph SERVER["⚙️ Next.js server (App Router)"]
        direction TB
        RC["Server Components — reads\n─────────────────\nlib/data.ts\ngetTasks · getTrashedTasks\ngetTags · getDailyTodos"]
        SA["Server Actions — writes\n─────────────────\napp/actions/*\ntasks · daily · tags"]
        MCP["MCP server — Streamable HTTP\n─────────────────\napp/api/mcp · lib/mcp/*\ntools + service (read/write)"]
    end

    LLM([External LLM client\nClaude Desktop · LM Studio · Ollama])

    subgraph DATA["🗄️ Persistence"]
        direction TB
        PR["Prisma 6\n─────────────────\nlib/prisma.ts (singleton)\nschema.prisma"]
        DB[("PostgreSQL 16\nTask · Tag · DailyTodo · SubTodo")]
    end

    %% Initialization (read)
    RC -->|"initial props"| CTX
    RC -->|"findMany"| PR

    %% Render
    CTX --> U1
    CTX --> U2

    %% Mutations (optimistic write)
    U1 -->|"mutation"| CTX
    U2 -->|"mutation"| CTX
    CTX -.->|"apply locally then call"| SA
    SA -->|"create / update / delete"| PR
    SA -.->|"failure → rollback + toast"| CTX

    %% MCP (external LLM)
    LLM -->|"MCP · Bearer token"| MCP
    MCP -->|"read / write"| PR

    PR <--> DB

    %% Styles
    style CLIENT fill:#1e293b,color:#e2e8f0,stroke:#3b82f6
    style SERVER fill:#0f172a,color:#e2e8f0,stroke:#10b981
    style DATA fill:#1c1917,color:#fde68a,stroke:#f59e0b
    style LLM fill:#2e1065,color:#e9d5ff,stroke:#a855f7
```
