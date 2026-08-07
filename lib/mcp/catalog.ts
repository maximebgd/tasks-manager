// Catalogue des outils MCP — SOURCE UNIQUE de la documentation.
//
// Ce fichier alimente :
//   - la page in-app `/settings/mcp/tools` (rendu JSX) ;
//   - le fichier `docs/mcp-tools.md` (généré par `npm run docs:mcp`) ;
//   - les `description` passées à `registerTool` dans `lib/mcp/tools.ts`.
//
// En ajoutant / modifiant un outil : mettre à jour ici, puis `npm run docs:mcp`.

export type ToolParam = {
  name: string;
  /** Type lisible (ex. `string`, `Status`, `date | null`, `string[]`). */
  type: string;
  required: boolean;
  /** Valeur par défaut appliquée par le serveur, si l'argument est omis. */
  default?: string;
  description: string;
};

export type ToolDoc = {
  name: string;
  group: ToolGroup;
  /** Description courte (réutilisée comme `description` du registerTool). */
  summary: string;
  params: ToolParam[];
  /** Ce que renvoie l'outil. */
  returns: string;
};

export const TOOL_GROUPS = [
  "Tâches — lecture",
  "Tâches — écriture",
  "Étiquettes",
  "Todos journalières",
] as const;
export type ToolGroup = (typeof TOOL_GROUPS)[number];

/** Types & énumérations référencés par les paramètres. */
export const MCP_TYPES: { name: string; def: string }[] = [
  { name: "Status", def: "`todo` · `in_progress` · `done`" },
  { name: "Priority", def: "`low` · `medium` · `high`" },
  {
    name: "TagColor",
    def: "`gray` · `brown` · `orange` · `yellow` · `green` · `blue` · `purple` · `pink` · `red`",
  },
  { name: "date", def: "chaîne ISO `YYYY-MM-DD` (ex. `2026-08-07`)" },
  {
    name: "Task",
    def: "`{ id, title, description?, status, priority, dueDate: string | null, tagIds: string[], createdAt, notes?, deletedAt: string | null }`",
  },
  { name: "Tag", def: "`{ id, name, color }`" },
  {
    name: "DailyTodo",
    def: "`{ id, date, title, done, deletedAt: string | null, subtasks: SubTodo[] }`",
  },
  { name: "SubTodo", def: "`{ id, title, done, deletedAt: string | null }`" },
];

/** Exemple d'appel JSON-RPC, partagé par la page et le Markdown. */
export const CALL_EXAMPLE = `{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "tools/call",
  "params": {
    "name": "create_task",
    "arguments": {
      "title": "Préparer la démo",
      "priority": "high",
      "dueDate": "2026-08-08"
    }
  }
}`;

export const MCP_TOOLS: ToolDoc[] = [
  // ————————————————————————————————— Tâches — lecture
  {
    name: "list_tasks",
    group: "Tâches — lecture",
    summary: "Liste les tâches du tableau. Sans filtre : toutes les tâches actives.",
    params: [
      { name: "status", type: "Status", required: false, description: "Ne garder qu'un statut." },
      { name: "tagId", type: "string", required: false, description: "Ne garder que les tâches portant cette étiquette (voir list_tags)." },
      { name: "trashed", type: "boolean", required: false, description: "true → liste la corbeille au lieu des tâches actives." },
    ],
    returns: "`Task[]` (JSON).",
  },
  {
    name: "search_tasks",
    group: "Tâches — lecture",
    summary:
      "Recherche insensible à la casse dans le titre, la description et les notes des tâches actives.",
    params: [
      { name: "query", type: "string (≥ 1 car.)", required: true, description: "Terme recherché." },
    ],
    returns: "`Task[]` (JSON).",
  },
  {
    name: "get_task",
    group: "Tâches — lecture",
    summary: "Renvoie une tâche complète (notes incluses) par son id.",
    params: [
      { name: "id", type: "string", required: true, description: "Identifiant de la tâche." },
    ],
    returns: "`Task` (JSON), ou un message si l'id est introuvable.",
  },

  // ————————————————————————————————— Tâches — écriture
  {
    name: "create_task",
    group: "Tâches — écriture",
    summary: "Crée une tâche. Seul le titre est requis.",
    params: [
      { name: "title", type: "string (≥ 1 car.)", required: true, description: "Titre." },
      { name: "description", type: "string", required: false, description: "Description courte." },
      { name: "status", type: "Status", required: false, default: "todo", description: "Colonne du tableau." },
      { name: "priority", type: "Priority", required: false, default: "medium", description: "Priorité." },
      { name: "dueDate", type: "date | null", required: false, default: "null", description: "Échéance YYYY-MM-DD." },
      { name: "tagIds", type: "string[]", required: false, description: "Ids d'étiquettes existantes (voir list_tags)." },
      { name: "notes", type: "string", required: false, description: "Contenu libre de la fiche." },
    ],
    returns: "La `Task` créée (JSON).",
  },
  {
    name: "update_task",
    group: "Tâches — écriture",
    summary: "Met à jour les champs fournis (les autres restent inchangés).",
    params: [
      { name: "id", type: "string", required: true, description: "Tâche à modifier." },
      { name: "title", type: "string (≥ 1 car.)", required: false, description: "Nouveau titre." },
      { name: "description", type: "string | null", required: false, description: "null efface la description." },
      { name: "status", type: "Status", required: false, description: "Nouveau statut." },
      { name: "priority", type: "Priority", required: false, description: "Nouvelle priorité." },
      { name: "dueDate", type: "date | null", required: false, description: "null retire l'échéance." },
      { name: "tagIds", type: "string[]", required: false, description: "Remplace l'ensemble des étiquettes." },
      { name: "notes", type: "string | null", required: false, description: "null efface les notes." },
    ],
    returns: "La `Task` mise à jour (JSON).",
  },
  {
    name: "delete_task",
    group: "Tâches — écriture",
    summary: "Met la tâche à la corbeille (suppression douce, réversible via restore_task).",
    params: [{ name: "id", type: "string", required: true, description: "Tâche à corbeiller." }],
    returns: "Message de confirmation.",
  },
  {
    name: "restore_task",
    group: "Tâches — écriture",
    summary: "Restaure une tâche depuis la corbeille.",
    params: [{ name: "id", type: "string", required: true, description: "Tâche à restaurer." }],
    returns: "Message de confirmation.",
  },
  {
    name: "purge_task",
    group: "Tâches — écriture",
    summary:
      "Supprime DÉFINITIVEMENT une tâche. ⚠️ Irréversible — à n'utiliser que sur confirmation explicite de l'utilisateur.",
    params: [{ name: "id", type: "string", required: true, description: "Tâche à supprimer définitivement." }],
    returns: "Message de confirmation.",
  },

  // ————————————————————————————————— Étiquettes
  {
    name: "list_tags",
    group: "Étiquettes",
    summary: "Liste toutes les étiquettes.",
    params: [],
    returns: "`Tag[]` (JSON).",
  },
  {
    name: "create_tag",
    group: "Étiquettes",
    summary: "Crée une étiquette.",
    params: [
      { name: "name", type: "string (≥ 1 car.)", required: true, description: "Nom (unique)." },
      { name: "color", type: "TagColor", required: true, description: "Une des 9 couleurs sémantiques." },
    ],
    returns: "Le `Tag` créé (JSON).",
  },
  {
    name: "update_tag",
    group: "Étiquettes",
    summary: "Renomme et/ou recolore une étiquette.",
    params: [
      { name: "id", type: "string", required: true, description: "Étiquette à modifier." },
      { name: "name", type: "string (≥ 1 car.)", required: false, description: "Nouveau nom." },
      { name: "color", type: "TagColor", required: false, description: "Nouvelle couleur." },
    ],
    returns: "Le `Tag` mis à jour (JSON).",
  },
  {
    name: "delete_tag",
    group: "Étiquettes",
    summary:
      "Supprime une étiquette ; ses liens avec les tâches partent en cascade. ⚠️ Irréversible.",
    params: [{ name: "id", type: "string", required: true, description: "Étiquette à supprimer." }],
    returns: "Message de confirmation.",
  },

  // ————————————————————————————————— Todos journalières
  {
    name: "list_daily_todos",
    group: "Todos journalières",
    summary: "Liste les todos journalières avec leurs sous-tâches (actives par défaut).",
    params: [
      { name: "date", type: "date", required: false, description: "Ne garder qu'un jour (YYYY-MM-DD)." },
      { name: "trashed", type: "boolean", required: false, description: "true → liste la corbeille." },
    ],
    returns: "`DailyTodo[]` (JSON).",
  },
  {
    name: "create_daily_todo",
    group: "Todos journalières",
    summary: "Crée une todo pour un jour donné.",
    params: [
      { name: "date", type: "date", required: true, description: "Jour concerné (YYYY-MM-DD)." },
      { name: "title", type: "string (≥ 1 car.)", required: true, description: "Intitulé." },
    ],
    returns: "Le `DailyTodo` créé (JSON).",
  },
  {
    name: "set_daily_todo_done",
    group: "Todos journalières",
    summary: "Marque une todo journalière comme faite ou non.",
    params: [
      { name: "id", type: "string", required: true, description: "Todo concernée." },
      { name: "done", type: "boolean", required: true, description: "État coché." },
    ],
    returns: "Message de confirmation.",
  },
  {
    name: "delete_daily_todo",
    group: "Todos journalières",
    summary: "Met une todo journalière à la corbeille (réversible via restore_daily_todo).",
    params: [{ name: "id", type: "string", required: true, description: "Todo à corbeiller." }],
    returns: "Message de confirmation.",
  },
  {
    name: "restore_daily_todo",
    group: "Todos journalières",
    summary: "Restaure une todo journalière depuis la corbeille.",
    params: [{ name: "id", type: "string", required: true, description: "Todo à restaurer." }],
    returns: "Message de confirmation.",
  },
  {
    name: "add_subtask",
    group: "Todos journalières",
    summary: "Ajoute une sous-tâche à une todo journalière existante.",
    params: [
      { name: "dailyTodoId", type: "string", required: true, description: "Todo parente." },
      { name: "title", type: "string (≥ 1 car.)", required: true, description: "Intitulé de la sous-tâche." },
    ],
    returns: "Message de confirmation.",
  },
  {
    name: "set_subtask_done",
    group: "Todos journalières",
    summary: "Marque une sous-tâche comme faite ou non.",
    params: [
      { name: "id", type: "string", required: true, description: "Sous-tâche concernée." },
      { name: "done", type: "boolean", required: true, description: "État coché." },
    ],
    returns: "Message de confirmation.",
  },
];

const BY_NAME = new Map(MCP_TOOLS.map((t) => [t.name, t]));

/** Description canonique d'un outil (utilisée par `registerTool`). */
export function toolSummary(name: string): string {
  const doc = BY_NAME.get(name);
  if (!doc) throw new Error(`Outil MCP inconnu dans le catalogue : ${name}`);
  return doc.summary;
}

/** Outils regroupés dans l'ordre de `TOOL_GROUPS`. */
export function toolsByGroup(): { group: ToolGroup; tools: ToolDoc[] }[] {
  return TOOL_GROUPS.map((group) => ({
    group,
    tools: MCP_TOOLS.filter((t) => t.group === group),
  }));
}
