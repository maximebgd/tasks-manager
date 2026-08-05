import type { DailyTodo, Priority, Status, TagColor } from "./types";

/** Étiquettes de démonstration (id stable pour un seed idempotent). */
export const mockTags: { id: string; name: string; color: TagColor }[] = [
  { id: "tag-produit", name: "produit", color: "blue" },
  { id: "tag-doc", name: "doc", color: "gray" },
  { id: "tag-design", name: "design", color: "green" },
  { id: "tag-setup", name: "setup", color: "yellow" },
  { id: "tag-tech", name: "tech", color: "green" },
  { id: "tag-dev", name: "dev", color: "blue" },
  { id: "tag-front", name: "front", color: "yellow" },
  { id: "tag-equipe", name: "équipe", color: "red" },
];

/** Tâche de seed : les étiquettes sont référencées par nom (cf. `mockTags`). */
type SeedTask = {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  tagNames: string[];
  createdAt: string;
  notes?: string;
};

/** Données de test — servent uniquement au seed (`prisma/seed.ts`). */
export const mockTasks: SeedTask[] = [
  {
    id: "t1",
    title: "Rédiger les specs du projet",
    description: "Définir le périmètre de la V1 et les user stories principales.",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-08-04",
    tagNames: ["produit", "doc"],
    createdAt: "2026-07-28",
  },
  {
    id: "t2",
    title: "Maquette de la page d'accueil",
    description: "Wireframe basse fidélité sur Figma.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-08-06",
    tagNames: ["design"],
    createdAt: "2026-07-29",
  },
  {
    id: "t3",
    title: "Configurer le dépôt Git",
    status: "done",
    priority: "low",
    dueDate: "2026-07-30",
    tagNames: ["setup"],
    createdAt: "2026-07-27",
  },
  {
    id: "t4",
    title: "Choisir la stack front",
    description: "Next.js + Tailwind, validé.",
    status: "done",
    priority: "medium",
    dueDate: null,
    tagNames: ["tech"],
    createdAt: "2026-07-27",
  },
  {
    id: "t5",
    title: "Composant liste de tâches",
    description: "Affichage, filtres et changement de statut.",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-08-01",
    tagNames: ["dev", "front"],
    createdAt: "2026-07-30",
  },
  {
    id: "t6",
    title: "Mettre en place le thème sombre",
    status: "todo",
    priority: "low",
    dueDate: null,
    tagNames: ["design", "front"],
    createdAt: "2026-07-31",
  },
  {
    id: "t7",
    title: "Préparer les données de test",
    status: "todo",
    priority: "medium",
    dueDate: "2026-08-02",
    tagNames: ["dev"],
    createdAt: "2026-07-31",
  },
  {
    id: "t8",
    title: "Réunion de cadrage avec l'équipe",
    description: "Aligner sur les priorités de la semaine.",
    status: "todo",
    priority: "high",
    dueDate: "2026-08-03",
    tagNames: ["équipe"],
    createdAt: "2026-07-31",
  },
];

/** Données de test pour la todo journalière (autour du 31 juillet 2026). */
export const mockDailyTodos: DailyTodo[] = [
  { id: "d1", date: "2026-07-30", title: "Relire la doc Next.js", done: true, subtasks: [] },
  { id: "d2", date: "2026-07-30", title: "Répondre aux e-mails", done: true, subtasks: [] },
  { id: "d3", date: "2026-07-31", title: "Standup à 10h", done: true, subtasks: [] },
  {
    id: "d4",
    date: "2026-07-31",
    title: "Coder la vue calendrier",
    done: true,
    subtasks: [
      { id: "d4s1", title: "Grille du mois", done: true },
      { id: "d4s2", title: "Navigation entre les mois", done: true },
    ],
  },
  {
    id: "d5",
    date: "2026-07-31",
    title: "Tester le drag & drop",
    done: false,
    subtasks: [
      { id: "d5s1", title: "Réordonner dans une colonne", done: true },
      { id: "d5s2", title: "Déplacer entre colonnes", done: false },
    ],
  },
  { id: "d6", date: "2026-07-31", title: "Faire une pause déjeuner", done: false, subtasks: [] },
  { id: "d7", date: "2026-08-01", title: "Préparer la démo", done: false, subtasks: [] },
  { id: "d8", date: "2026-08-01", title: "Point avec l'équipe design", done: false, subtasks: [] },
];
