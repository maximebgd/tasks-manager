import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { TAG_COLORS, type TagColor } from "@/lib/types";
import { todayISO } from "@/lib/date";
import * as svc from "./service";

// Enregistrement des outils exposés au LLM via MCP. Périmètre : lecture +
// écriture complète (tâches, étiquettes, todos journalières). Chaque outil
// valide ses entrées avec zod et renvoie du texte JSON sérialisé.

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
      description:
        "Liste les tâches du tableau. Filtres optionnels : statut, id d'étiquette, " +
        "ou corbeille (tâches supprimées). Sans filtre : toutes les tâches actives.",
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
      description:
        "Recherche insensible à la casse dans le titre, la description et les notes " +
        "des tâches actives.",
      inputSchema: z.object({ query: z.string().min(1) }),
    },
    async ({ query }) => json(await svc.searchTasks(query)),
  );

  server.registerTool(
    "get_task",
    {
      title: "Détail d'une tâche",
      description: "Renvoie une tâche complète par son id (notes incluses).",
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
      description:
        "Crée une tâche. Seul le titre est requis. Défauts : statut=todo, " +
        "priorité=medium. `dueDate` au format YYYY-MM-DD (aujourd'hui = " +
        `${todayISO()}). \`tagIds\` : ids d'étiquettes existantes (voir list_tags).`,
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
      description:
        "Met à jour les champs fournis d'une tâche (les autres restent inchangés). " +
        "`tagIds` remplace l'ensemble des étiquettes. Passer null efface un champ.",
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
      description:
        "Met la tâche à la corbeille (suppression douce, réversible via restore_task).",
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
      description: "Restaure une tâche depuis la corbeille.",
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
      description:
        "Supprime définitivement une tâche. IRRÉVERSIBLE : à n'utiliser que sur " +
        "confirmation explicite de l'utilisateur.",
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
      description: "Liste toutes les étiquettes (id, nom, couleur).",
      inputSchema: z.object({}),
    },
    async () => json(await svc.listTags()),
  );

  server.registerTool(
    "create_tag",
    {
      title: "Créer une étiquette",
      description: `Crée une étiquette. Couleurs valides : ${TAG_COLORS.join(", ")}.`,
      inputSchema: z.object({ name: z.string().min(1), color: colorSchema }),
    },
    async (input) => json(await svc.createTag(input)),
  );

  server.registerTool(
    "update_tag",
    {
      title: "Modifier une étiquette",
      description: "Renomme et/ou recolore une étiquette.",
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
      description:
        "Supprime une étiquette ; ses liens avec les tâches partent en cascade. " +
        "IRRÉVERSIBLE.",
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
      description:
        "Liste les todos journalières (avec leurs sous-tâches). Filtre optionnel " +
        `par jour (YYYY-MM-DD ; aujourd'hui = ${todayISO()}).`,
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
      description: `Crée une todo pour un jour donné (YYYY-MM-DD ; aujourd'hui = ${todayISO()}).`,
      inputSchema: z.object({ date: dateSchema, title: z.string().min(1) }),
    },
    async (input) => json(await svc.createDailyTodo(input)),
  );

  server.registerTool(
    "set_daily_todo_done",
    {
      title: "Cocher/décocher une todo journalière",
      description: "Marque une todo journalière comme faite ou non.",
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
      description: "Met une todo journalière à la corbeille (réversible).",
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
      description: "Restaure une todo journalière depuis la corbeille.",
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
      description: "Ajoute une sous-tâche à une todo journalière existante.",
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
      description: "Marque une sous-tâche comme faite ou non.",
      inputSchema: z.object({ id: z.string(), done: z.boolean() }),
    },
    async ({ id, done }) => {
      await svc.setSubtaskDone(id, done);
      return message(`Sous-tâche ${id} : done=${done}.`);
    },
  );
}
