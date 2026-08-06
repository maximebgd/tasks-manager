export type Status = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";

/** Couleurs sémantiques disponibles pour une étiquette (cf. tokens `tag-*`). */
export type TagColor =
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export const TAG_COLORS: TagColor[] = [
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
];

/** Étiquette réutilisable, partagée entre tâches. */
export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  /** Échéance au format ISO (YYYY-MM-DD), ou null si aucune. */
  dueDate: string | null;
  /** Ids des étiquettes rattachées (résolues via le store des tags). */
  tagIds: string[];
  createdAt: string;
  /** Contenu libre de la fiche (notes), affiché sur la page détail. */
  notes?: string;
  /** Date ISO de mise à la corbeille (soft delete), ou null si la tâche est active. */
  deletedAt?: string | null;
}

/** Sous-tâche d'une todo journalière (puce cochable). */
export interface SubTodo {
  id: string;
  title: string;
  done: boolean;
  /** Date ISO de mise à la corbeille (soft delete), ou null si active. */
  deletedAt?: string | null;
}

/** Élément d'une todo journalière : une liste simple par jour. */
export interface DailyTodo {
  id: string;
  /** Jour concerné au format ISO (YYYY-MM-DD). */
  date: string;
  title: string;
  done: boolean;
  /** Sous-tâches optionnelles, affichées en puces sous la tâche. */
  subtasks: SubTodo[];
  /** Date ISO de mise à la corbeille (soft delete), ou null si active. */
  deletedAt?: string | null;
}

export const STATUSES: { value: Status; label: string }[] = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
];

export const statusLabel = (s: Status) =>
  STATUSES.find((x) => x.value === s)?.label ?? s;

export const priorityLabel = (p: Priority) =>
  PRIORITIES.find((x) => x.value === p)?.label ?? p;
