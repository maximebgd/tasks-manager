import { daysFromTodayISO } from "./date";
import type { DailyTodo, Priority, Status, TagColor } from "./types";

/**
 * Étiquettes de démonstration (id stable pour un seed idempotent).
 * Le jeu couvre **les 9 couleurs sémantiques** (`TagColor`) pour montrer toute
 * la palette : gray, brown, orange, yellow, green, blue, purple, pink, red.
 */
export const mockTags: { id: string; name: string; color: TagColor }[] = [
  { id: "tag-produit", name: "produit", color: "blue" },
  { id: "tag-doc", name: "doc", color: "gray" },
  { id: "tag-design", name: "design", color: "green" },
  { id: "tag-setup", name: "setup", color: "yellow" },
  { id: "tag-tech", name: "tech", color: "green" },
  { id: "tag-dev", name: "dev", color: "blue" },
  { id: "tag-front", name: "front", color: "yellow" },
  { id: "tag-equipe", name: "équipe", color: "red" },
  { id: "tag-backend", name: "backend", color: "purple" },
  { id: "tag-infra", name: "infra", color: "brown" },
  { id: "tag-urgent", name: "urgent", color: "orange" },
  { id: "tag-bug", name: "bug", color: "red" },
  { id: "tag-qa", name: "qa", color: "orange" },
  { id: "tag-perso", name: "perso", color: "pink" },
];

/**
 * Tâche de seed : les étiquettes sont référencées par nom (cf. `mockTags`).
 * `deletedAt` (ISO) place la tâche à la corbeille ; absent = tâche active.
 */
type SeedTask = {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  tagNames: string[];
  createdAt: string;
  /** Notes de la fiche, au format **Markdown** (rendu sur la page détail). */
  notes?: string;
  /** Date ISO de mise à la corbeille (soft delete). Absent = tâche active. */
  deletedAt?: string;
};

/**
 * Données de test — servent uniquement au seed (`prisma/seed.ts`).
 * Les dates sont **relatives au jour du seed** (`daysFromTodayISO`) pour que la
 * démo reste cohérente (tâches en retard / aujourd'hui / à venir) quel que soit
 * le jour où on la génère. Aucune date en dur.
 *
 * Le jeu est volontairement large pour illustrer **chaque fonctionnalité** :
 * les 3 statuts, les 3 priorités, tâches en retard / aujourd'hui / à venir /
 * sans échéance, une à plusieurs étiquettes, des notes Markdown riches, et
 * quelques tâches à la corbeille (`deletedAt`).
 */
export const mockTasks: SeedTask[] = [
  // ── En retard (échéance passée, non terminée) ───────────────────────────
  {
    id: "t1",
    title: "Corriger le bug de synchronisation hors ligne",
    description: "Les modifications faites hors ligne se perdent au retour du réseau.",
    status: "in_progress",
    priority: "high",
    dueDate: daysFromTodayISO(-2),
    tagNames: ["dev", "bug", "urgent"],
    createdAt: daysFromTodayISO(-6),
    notes: `## Symptôme
Les tâches modifiées **hors ligne** ne se resynchronisent pas au retour du réseau.

## Reproduction
1. Passer en mode avion
2. Déplacer une tâche entre deux colonnes
3. Rétablir le réseau → l'ordre est perdu

## Piste
Le rollback optimiste écrase l'état serveur. Voir \`lib/tasks-context.tsx\`.

- [x] Reproduire le problème
- [ ] Ajouter un test de non-régression
- [ ] Corriger le rollback`,
  },
  {
    id: "t2",
    title: "Migrer la base vers PostgreSQL 16",
    description: "Passer l'image Docker à postgres:16-alpine et rejouer les migrations.",
    status: "todo",
    priority: "medium",
    dueDate: daysFromTodayISO(-5),
    tagNames: ["backend", "infra"],
    createdAt: daysFromTodayISO(-8),
  },
  {
    id: "t3",
    title: "Relancer le prestataire pour le logo",
    status: "todo",
    priority: "low",
    dueDate: daysFromTodayISO(-1),
    tagNames: ["design", "équipe"],
    createdAt: daysFromTodayISO(-4),
  },

  // ── Échéance aujourd'hui ────────────────────────────────────────────────
  {
    id: "t4",
    title: "Déployer la version 1.0 en production",
    description: "Mise en production via docker-compose.prod.yml.",
    status: "in_progress",
    priority: "high",
    dueDate: daysFromTodayISO(0),
    tagNames: ["dev", "backend", "urgent"],
    createdAt: daysFromTodayISO(-3),
    notes: `# Checklist de mise en production

## Avant le déploiement
- [x] Toutes les migrations Prisma passent (\`prisma migrate deploy\`)
- [x] Variables d'environnement vérifiées (\`DATABASE_URL\`, \`MCP_TOKEN\`)
- [ ] Sauvegarde de la base de données
- [ ] Créer le tag de version \`v1.0.0\`

## Déploiement
- [ ] \`docker compose -f docker-compose.prod.yml up -d\`
- [ ] Vérifier le health check \`/api/mcp\`

## Après
- [ ] Smoke test des 3 pages principales
- [ ] Annoncer à l'équipe`,
  },
  {
    id: "t5",
    title: "Valider les maquettes finales",
    description: "Revue des écrans kanban, daily et calendrier avec le design.",
    status: "todo",
    priority: "medium",
    dueDate: daysFromTodayISO(0),
    tagNames: ["design", "produit"],
    createdAt: daysFromTodayISO(-2),
  },

  // ── À venir ─────────────────────────────────────────────────────────────
  {
    id: "t6",
    title: "Rédiger les specs de la V1",
    description: "Définir le périmètre et les user stories principales.",
    status: "in_progress",
    priority: "high",
    dueDate: daysFromTodayISO(3),
    tagNames: ["produit", "doc"],
    createdAt: daysFromTodayISO(-3),
    notes: `# Specs V1

## Objectif
Livrer un gestionnaire de tâches **façon Notion** : kanban, todo journalière, calendrier.

## User stories
- [x] Je crée une tâche avec un titre et une priorité
- [x] Je glisse-dépose une tâche entre les colonnes
- [ ] Je consulte mes tâches dans un **calendrier** mensuel
- [ ] Je restaure une tâche depuis la __corbeille__

## Hors périmètre
Notifications e-mail, partage multi-utilisateurs.

Voir la [doc produit](https://example.com/specs).`,
  },
  {
    id: "t7",
    title: "Composant liste de tâches",
    description: "Affichage, filtres et changement de statut.",
    status: "in_progress",
    priority: "high",
    dueDate: daysFromTodayISO(1),
    tagNames: ["dev", "front"],
    createdAt: daysFromTodayISO(-1),
  },
  {
    id: "t8",
    title: "Maquette de la page d'accueil",
    description: "Wireframe basse fidélité sur Figma.",
    status: "todo",
    priority: "medium",
    dueDate: daysFromTodayISO(2),
    tagNames: ["design"],
    createdAt: daysFromTodayISO(-2),
  },
  {
    id: "t9",
    title: "Réunion de cadrage avec l'équipe",
    description: "Aligner sur les priorités de la semaine.",
    status: "todo",
    priority: "high",
    dueDate: daysFromTodayISO(3),
    tagNames: ["équipe"],
    createdAt: daysFromTodayISO(0),
  },
  {
    id: "t10",
    title: "Écrire la documentation des outils MCP",
    description: "Décrire chaque outil du serveur MCP et régénérer la doc.",
    status: "todo",
    priority: "medium",
    dueDate: daysFromTodayISO(5),
    tagNames: ["doc", "backend"],
    createdAt: daysFromTodayISO(-1),
    notes: `# Documentation des outils MCP

Rappel : la **source unique** est \`lib/mcp/catalog.ts\`.

- [ ] Décrire chaque outil (entrées / sorties)
- [ ] Régénérer avec \`npm run docs:mcp\`
- [ ] Relire le rendu sur \`/settings/mcp/tools\`

> ⚠️ Ne pas éditer \`docs/mcp-tools.md\` à la main.`,
  },
  {
    id: "t11",
    title: "Configurer le CI/CD GitHub Actions",
    description: "Lint, type-check et build sur chaque pull request.",
    status: "todo",
    priority: "medium",
    dueDate: daysFromTodayISO(7),
    tagNames: ["infra", "setup", "tech"],
    createdAt: daysFromTodayISO(0),
  },
  {
    id: "t12",
    title: "Mettre en place les tests end-to-end",
    description: "Parcours critiques : créer, déplacer et supprimer une tâche.",
    status: "todo",
    priority: "low",
    dueDate: daysFromTodayISO(8),
    tagNames: ["dev", "qa", "tech"],
    createdAt: daysFromTodayISO(0),
  },
  {
    id: "t13",
    title: "Préparer les données de test",
    status: "todo",
    priority: "medium",
    dueDate: daysFromTodayISO(2),
    tagNames: ["dev"],
    createdAt: daysFromTodayISO(0),
  },

  // ── Sans échéance ───────────────────────────────────────────────────────
  {
    id: "t14",
    title: "Mettre en place le thème sombre",
    status: "todo",
    priority: "low",
    dueDate: null,
    tagNames: ["design", "front"],
    createdAt: daysFromTodayISO(0),
  },
  {
    id: "t15",
    title: "Réfléchir au modèle de tarification",
    description: "Brainstorm — rien n'est décidé.",
    status: "todo",
    priority: "low",
    dueDate: null,
    tagNames: ["produit", "perso"],
    createdAt: daysFromTodayISO(-1),
    notes: `# Brainstorm tarification

Quelques pistes, **rien n'est décidé** :

- **Gratuit** : 1 tableau, 50 tâches
- **Pro** : tableaux illimités, corbeille 30 jours
- **Équipe** : partage + serveur MCP

À creuser : _facturation à l'usage du serveur MCP ?_`,
  },
  {
    id: "t16",
    title: "Onboarding du nouveau développeur",
    description: "Accès, environnement local, tour du code.",
    status: "todo",
    priority: "low",
    dueDate: daysFromTodayISO(10),
    tagNames: ["équipe", "perso"],
    createdAt: daysFromTodayISO(0),
  },

  // ── Terminées ───────────────────────────────────────────────────────────
  {
    id: "t17",
    title: "Initialiser le projet Next.js 16",
    description: "App Router + Turbopack + TypeScript strict.",
    status: "done",
    priority: "medium",
    dueDate: daysFromTodayISO(-6),
    tagNames: ["setup", "tech"],
    createdAt: daysFromTodayISO(-7),
  },
  {
    id: "t18",
    title: "Intégrer Tailwind CSS v4",
    description: "Config CSS-first dans globals.css, tokens sémantiques.",
    status: "done",
    priority: "low",
    dueDate: daysFromTodayISO(-4),
    tagNames: ["front", "setup"],
    createdAt: daysFromTodayISO(-6),
  },
  {
    id: "t19",
    title: "Créer le schéma Prisma",
    description: "Task, Tag (N-N), DailyTodo, SubTodo.",
    status: "done",
    priority: "high",
    dueDate: daysFromTodayISO(-3),
    tagNames: ["backend", "tech"],
    createdAt: daysFromTodayISO(-5),
    notes: `## Modèle de données
\`Task\`, \`Tag\` (relation N-N), \`DailyTodo\`, \`SubTodo\`.

Les dates métier sont stockées en **\`String\`** ISO \`"YYYY-MM-DD"\`, pas en \`DateTime\`.
Soft delete (corbeille) via \`deletedAt\`.`,
  },
  {
    id: "t20",
    title: "Configurer le dépôt Git",
    status: "done",
    priority: "low",
    dueDate: daysFromTodayISO(-6),
    tagNames: ["setup"],
    createdAt: daysFromTodayISO(-7),
  },
  {
    id: "t21",
    title: "Choisir la stack front",
    description: "Next.js + Tailwind, validé.",
    status: "done",
    priority: "medium",
    dueDate: null,
    tagNames: ["tech"],
    createdAt: daysFromTodayISO(-7),
  },

  // ── À la corbeille (soft delete) ────────────────────────────────────────
  {
    id: "t22",
    title: "POC intégration Slack",
    description: "Notifier une tâche terminée dans un canal Slack.",
    status: "in_progress",
    priority: "medium",
    dueDate: daysFromTodayISO(-2),
    tagNames: ["dev", "backend"],
    createdAt: daysFromTodayISO(-9),
    deletedAt: daysFromTodayISO(-1),
    notes: `## Abandonné
Le POC d'intégration Slack est mis de côté : **hors périmètre V1**.
Repartir de ces notes si on le relance au Q4.`,
  },
  {
    id: "t23",
    title: "Ancienne page de profil",
    description: "Remplacée par les réglages — écran abandonné.",
    status: "todo",
    priority: "low",
    dueDate: null,
    tagNames: ["front"],
    createdAt: daysFromTodayISO(-10),
    deletedAt: daysFromTodayISO(-3),
  },
  {
    id: "t24",
    title: "Doublon : rédiger les specs",
    status: "todo",
    priority: "low",
    dueDate: null,
    tagNames: ["doc"],
    createdAt: daysFromTodayISO(-8),
    deletedAt: daysFromTodayISO(-5),
  },
];

/**
 * Todos journalières de démonstration (dates relatives au jour du seed).
 * Illustre : journées passées terminées, journée du jour mêlant fait / à faire,
 * jours à venir, sous-tâches, une **sous-tâche à la corbeille** sous une todo
 * active (d5), et des **todos entières à la corbeille** (avec ou sans
 * sous-tâches).
 */
export const mockDailyTodos: DailyTodo[] = [
  // ── Hier ────────────────────────────────────────────────────────────────
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
    id: "d9",
    date: daysFromTodayISO(-1),
    title: "Faire le point sprint",
    done: true,
    subtasks: [
      { id: "d9s1", title: "Lister les tâches terminées", done: true },
      { id: "d9s2", title: "Reporter le reste au sprint suivant", done: true },
    ],
  },

  // ── Aujourd'hui ─────────────────────────────────────────────────────────
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
      // Sous-tâche à la corbeille alors que la todo parente reste active.
      { id: "d5s3", title: "Ancien cas de test obsolète", done: false, deletedAt: daysFromTodayISO(0) },
    ],
  },
  {
    id: "d10",
    date: daysFromTodayISO(0),
    title: "Revue de code de la PR #42",
    done: false,
    subtasks: [
      { id: "d10s1", title: "Relire le diff", done: true },
      { id: "d10s2", title: "Tester en local", done: false },
      { id: "d10s3", title: "Laisser des commentaires", done: false },
    ],
  },
  { id: "d6", date: daysFromTodayISO(0), title: "Faire une pause déjeuner", done: false, subtasks: [] },
  { id: "d11", date: daysFromTodayISO(0), title: "Mettre à jour le changelog", done: false, subtasks: [] },

  // ── Demain ──────────────────────────────────────────────────────────────
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
  {
    id: "d12",
    date: daysFromTodayISO(1),
    title: "Écrire les tests unitaires",
    done: false,
    subtasks: [
      { id: "d12s1", title: "Cas nominal", done: false },
      { id: "d12s2", title: "Cas d'erreur", done: false },
    ],
  },

  // ── Après-demain ────────────────────────────────────────────────────────
  {
    id: "d13",
    date: daysFromTodayISO(2),
    title: "Rétrospective d'équipe",
    done: false,
    subtasks: [
      { id: "d13s1", title: "Préparer le board", done: false },
      { id: "d13s2", title: "Collecter le feedback", done: false },
      { id: "d13s3", title: "Planifier les actions", done: false },
    ],
  },

  // ── À la corbeille (soft delete) ────────────────────────────────────────
  {
    id: "d14",
    date: daysFromTodayISO(0),
    title: "Appeler le fournisseur (annulé)",
    done: false,
    subtasks: [],
    deletedAt: daysFromTodayISO(-1),
  },
  {
    id: "d15",
    date: daysFromTodayISO(-1),
    title: "Ancienne routine matinale",
    done: true,
    subtasks: [
      { id: "d15s1", title: "Méditer 10 min", done: true },
      { id: "d15s2", title: "Revue des priorités", done: true },
    ],
    deletedAt: daysFromTodayISO(-2),
  },
];
