import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { TAG_COLORS, type TagColor } from "@/lib/types";
import { todayISO } from "@/lib/date";
import { toolSummary } from "./catalog";
import * as svc from "./service";

// Enregistrement des outils exposés au LLM via MCP. Périmètre : lecture +
// écriture complète (tâches, étiquettes, todos journalières). Chaque outil
// valide ses entrées avec zod et renvoie du texte JSON sérialisé.
//
// Les `description` proviennent du catalogue (`lib/mcp/catalog.ts`, source
// unique partagée avec la doc). Les outils datés y ajoutent le jour courant.

// Rappel du jour courant, ajouté à l'exécution aux descriptions des outils
// manipulant des dates (le catalogue reste statique, sans date figée).
const withToday = (name: string) =>
  `${toolSummary(name)} Dates au format YYYY-MM-DD (aujourd'hui = ${todayISO()}).`;

const statusSchema = z.enum(["todo", "in_progress", "done"]);
const prioritySchema = z.enum(["low", "medium", "high"]);
const colorSchema = z.enum(TAG_COLORS as [TagColor, ...TagColor[]]);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format ISO YYYY-MM-DD attendue");

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});
const message = (text: string) => ({ content: [{ type: "text" as const, text }] });

export function registerTools(server: McpServer): void {
  // ————————————————————————————————————————————————— Tâches (lecture)

  server.registerTool(
    "list_tasks",
    {
      title: "Lister les tâches",
      description: toolSummary("list_tasks"),
      inputSchema: z.object({
        status: statusSchema.optional().describe("todo | in_progress | done"),
        tagId: z.string().optional().describe("id d'une étiquette (voir list_tags)"),
        trashed: z
          .boolean()
          .optional()
          .describe("true pour lister la corbeille au lieu des tâches actives"),
      }),
    },
    async ({ status, tagId, trashed }) =>
      json(await svc.listTasks({ status, tagId, trashed })),
  );

  server.registerTool(
    "search_tasks",
    {
      title: "Rechercher des tâches",
      description: toolSummary("search_tasks"),
      inputSchema: z.object({ query: z.string().min(1) }),
    },
    async ({ query }) => json(await svc.searchTasks(query)),
  );

  server.registerTool(
    "get_task",
    {
      title: "Détail d'une tâche",
      description: toolSummary("get_task"),
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const task = await svc.getTask(id);
      return task ? json(task) : message(`Aucune tâche avec l'id ${id}.`);
    },
  );

  // ————————————————————————————————————————————————— Tâches (écriture)

  server.registerTool(
    "create_task",
    {
      title: "Créer une tâche",
      description: withToday("create_task"),
      inputSchema: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        status: statusSchema.optional(),
        priority: prioritySchema.optional(),
        dueDate: dateSchema.nullish(),
        tagIds: z.array(z.string()).optional(),
        notes: z.string().optional().describe("contenu libre de la fiche"),
      }),
    },
    async (input) => json(await svc.createTask(input)),
  );

  server.registerTool(
    "update_task",
    {
      title: "Modifier une tâche",
      description: toolSummary("update_task"),
      inputSchema: z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().nullish(),
        status: statusSchema.optional(),
        priority: prioritySchema.optional(),
        dueDate: dateSchema.nullish(),
        tagIds: z.array(z.string()).optional(),
        notes: z.string().nullish(),
      }),
    },
    async ({ id, ...patch }) => json(await svc.updateTask(id, patch)),
  );

  server.registerTool(
    "delete_task",
    {
      title: "Supprimer une tâche (corbeille)",
      description: toolSummary("delete_task"),
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      await svc.softDeleteTask(id);
      return message(`Tâche ${id} mise à la corbeille.`);
    },
  );

  server.registerTool(
    "restore_task",
    {
      title: "Restaurer une tâche",
      description: toolSummary("restore_task"),
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      await svc.restoreTask(id);
      return message(`Tâche ${id} restaurée.`);
    },
  );

  server.registerTool(
    "purge_task",
    {
      title: "Supprimer définitivement une tâche",
      description: toolSummary("purge_task"),
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      await svc.purgeTask(id);
      return message(`Tâche ${id} supprimée définitivement.`);
    },
  );

  // ————————————————————————————————————————————————— Étiquettes

  server.registerTool(
    "list_tags",
    {
      title: "Lister les étiquettes",
      description: toolSummary("list_tags"),
      inputSchema: z.object({}),
    },
    async () => json(await svc.listTags()),
  );

  server.registerTool(
    "create_tag",
    {
      title: "Créer une étiquette",
      description: `${toolSummary("create_tag")} Couleurs valides : ${TAG_COLORS.join(", ")}.`,
      inputSchema: z.object({ name: z.string().min(1), color: colorSchema }),
    },
    async (input) => json(await svc.createTag(input)),
  );

  server.registerTool(
    "update_tag",
    {
      title: "Modifier une étiquette",
      description: toolSummary("update_tag"),
      inputSchema: z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: colorSchema.optional(),
      }),
    },
    async ({ id, ...patch }) => json(await svc.updateTag(id, patch)),
  );

  server.registerTool(
    "delete_tag",
    {
      title: "Supprimer une étiquette",
      description: toolSummary("delete_tag"),
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      await svc.deleteTag(id);
      return message(`Étiquette ${id} supprimée.`);
    },
  );

  // ————————————————————————————————————————————————— Todos journalières

  server.registerTool(
    "list_daily_todos",
    {
      title: "Lister les todos journalières",
      description: withToday("list_daily_todos"),
      inputSchema: z.object({
        date: dateSchema.optional(),
        trashed: z.boolean().optional().describe("true pour lister la corbeille"),
      }),
    },
    async ({ date, trashed }) => json(await svc.listDailyTodos({ date, trashed })),
  );

  server.registerTool(
    "create_daily_todo",
    {
      title: "Créer une todo journalière",
      description: withToday("create_daily_todo"),
      inputSchema: z.object({ date: dateSchema, title: z.string().min(1) }),
    },
    async (input) => json(await svc.createDailyTodo(input)),
  );

  server.registerTool(
    "set_daily_todo_done",
    {
      title: "Cocher/décocher une todo journalière",
      description: toolSummary("set_daily_todo_done"),
      inputSchema: z.object({ id: z.string(), done: z.boolean() }),
    },
    async ({ id, done }) => {
      await svc.setDailyTodoDone(id, done);
      return message(`Todo ${id} : done=${done}.`);
    },
  );

  server.registerTool(
    "delete_daily_todo",
    {
      title: "Supprimer une todo journalière (corbeille)",
      description: toolSummary("delete_daily_todo"),
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      await svc.softDeleteDailyTodo(id);
      return message(`Todo ${id} mise à la corbeille.`);
    },
  );

  server.registerTool(
    "restore_daily_todo",
    {
      title: "Restaurer une todo journalière",
      description: toolSummary("restore_daily_todo"),
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      await svc.restoreDailyTodo(id);
      return message(`Todo ${id} restaurée.`);
    },
  );

  server.registerTool(
    "add_subtask",
    {
      title: "Ajouter une sous-tâche",
      description: toolSummary("add_subtask"),
      inputSchema: z.object({ dailyTodoId: z.string(), title: z.string().min(1) }),
    },
    async (input) => {
      await svc.addSubtask(input);
      return message(`Sous-tâche ajoutée à la todo ${input.dailyTodoId}.`);
    },
  );

  server.registerTool(
    "set_subtask_done",
    {
      title: "Cocher/décocher une sous-tâche",
      description: toolSummary("set_subtask_done"),
      inputSchema: z.object({ id: z.string(), done: z.boolean() }),
    },
    async ({ id, done }) => {
      await svc.setSubtaskDone(id, done);
      return message(`Sous-tâche ${id} : done=${done}.`);
    },
  );
}
