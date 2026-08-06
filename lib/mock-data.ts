import { daysFromTodayISO } from "./date";
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

/**
 * Données de test — servent uniquement au seed (`prisma/seed.ts`).
 * Les dates sont **relatives au jour du seed** (`daysFromTodayISO`) pour que la
 * démo reste cohérente (tâches en retard / aujourd'hui / à venir) quel que soit
 * le jour où on la génère. Aucune date en dur.
 */
export const mockTasks: SeedTask[] = [
  {
    id: "t1",
    title: "Rédiger les specs du projet",
    description: "Définir le périmètre de la V1 et les user stories principales.",
    status: "in_progress",
    priority: "high",
    dueDate: daysFromTodayISO(4),
    tagNames: ["produit", "doc"],
    createdAt: daysFromTodayISO(-3),
  },
  {
    id: "t2",
    title: "Maquette de la page d'accueil",
    description: "Wireframe basse fidélité sur Figma.",
    status: "todo",
    priority: "medium",
    dueDate: daysFromTodayISO(6),
    tagNames: ["design"],
    createdAt: daysFromTodayISO(-2),
  },
  {
    id: "t3",
    title: "Configurer le dépôt Git",
    status: "done",
    priority: "low",
    dueDate: daysFromTodayISO(-1),
    tagNames: ["setup"],
    createdAt: daysFromTodayISO(-4),
  },
  {
    id: "t4",
    title: "Choisir la stack front",
    description: "Next.js + Tailwind, validé.",
    status: "done",
    priority: "medium",
    dueDate: null,
    tagNames: ["tech"],
    createdAt: daysFromTodayISO(-4),
  },
  {
    id: "t5",
    title: "Composant liste de tâches",
    description: "Affichage, filtres et changement de statut.",
    status: "in_progress",
    priority: "high",
    dueDate: daysFromTodayISO(1),
    tagNames: ["dev", "front"],
    createdAt: daysFromTodayISO(-1),
  },
  {
    id: "t6",
    title: "Mettre en place le thème sombre",
    status: "todo",
    priority: "low",
    dueDate: null,
    tagNames: ["design", "front"],
    createdAt: daysFromTodayISO(0),
  },
  {
    id: "t7",
    title: "Préparer les données de test",
    status: "todo",
    priority: "medium",
    dueDate: daysFromTodayISO(2),
    tagNames: ["dev"],
    createdAt: daysFromTodayISO(0),
  },
  {
    id: "t8",
    title: "Réunion de cadrage avec l'équipe",
    description: "Aligner sur les priorités de la semaine.",
    status: "todo",
    priority: "high",
    dueDate: daysFromTodayISO(3),
    tagNames: ["équipe"],
    createdAt: daysFromTodayISO(0),
  },
];

/** Données de test pour la todo journalière (relatives au jour du seed). */
export const mockDailyTodos: DailyTodo[] = [
  {
    id: "d1",
    date: daysFromTodayISO(-1),
    title: "Relire la doc Next.js",
    done: true,
    subtasks: [
      { id: "d1s1", title: "App Router", done: true },
      { id: "d1s2", title: "Server Actions", done: true },
    ],
  },
  { id: "d2", date: daysFromTodayISO(-1), title: "Répondre aux e-mails", done: true, subtasks: [] },
  {
    id: "d3",
    date: daysFromTodayISO(0),
    title: "Standup à 10h",
    done: true,
    subtasks: [
      { id: "d3s1", title: "Préparer les points bloquants", done: true },
      { id: "d3s2", title: "Noter les décisions", done: true },
    ],
  },
  {
    id: "d4",
    date: daysFromTodayISO(0),
    title: "Coder la vue calendrier",
    done: true,
    subtasks: [
      { id: "d4s1", title: "Grille du mois", done: true },
      { id: "d4s2", title: "Navigation entre les mois", done: true },
    ],
  },
  {
    id: "d5",
    date: daysFromTodayISO(0),
    title: "Tester le drag & drop",
    done: false,
    subtasks: [
      { id: "d5s1", title: "Réordonner dans une colonne", done: true },
      { id: "d5s2", title: "Déplacer entre colonnes", done: false },
    ],
  },
  { id: "d6", date: daysFromTodayISO(0), title: "Faire une pause déjeuner", done: false, subtasks: [] },
  {
    id: "d7",
    date: daysFromTodayISO(1),
    title: "Préparer la démo",
    done: false,
    subtasks: [
      { id: "d7s1", title: "Écrire le script de démo", done: false },
      { id: "d7s2", title: "Préparer le jeu de données", done: false },
      { id: "d7s3", title: "Répéter une fois", done: false },
    ],
  },
  {
    id: "d8",
    date: daysFromTodayISO(1),
    title: "Point avec l'équipe design",
    done: false,
    subtasks: [
      { id: "d8s1", title: "Lister les écrans à valider", done: false },
      { id: "d8s2", title: "Partager les maquettes", done: false },
    ],
  },
];
