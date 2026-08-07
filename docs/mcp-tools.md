<!-- Généré par `npm run docs:mcp` depuis lib/mcp/catalog.ts — ne pas éditer à la main. -->

# Référence des outils MCP

Documentation des outils exposés par le serveur MCP (`app/api/mcp`). Chaque outil
est appelé via la méthode JSON-RPC `tools/call` :

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "<nom_outil>", "arguments": { /* … */ } }
}
```

Toutes les requêtes exigent l'en-tête `Authorization: Bearer <MCP_TOKEN>`. Les
outils renvoient leur résultat sous forme de **texte** (`content[].text`) :
JSON sérialisé pour les lectures/créations, message de confirmation pour les
actions sans valeur de retour.

> **Périmètre** : lecture + écriture complète. Les identifiants (`id`) sont
> générés par la base — le LLM ne les fournit **jamais** à la création.

## Types & énumérations

| Type | Valeurs / champs |
|---|---|
| `Status` | `todo` · `in_progress` · `done` |
| `Priority` | `low` · `medium` · `high` |
| `TagColor` | `gray` · `brown` · `orange` · `yellow` · `green` · `blue` · `purple` · `pink` · `red` |
| `date` | chaîne ISO `YYYY-MM-DD` (ex. `2026-08-07`) |
| `Task` | `{ id, title, description?, status, priority, dueDate: string \| null, tagIds: string[], createdAt, notes?, deletedAt: string \| null }` |
| `Tag` | `{ id, name, color }` |
| `DailyTodo` | `{ id, date, title, done, deletedAt: string \| null, subtasks: SubTodo[] }` |
| `SubTodo` | `{ id, title, done, deletedAt: string \| null }` |

Conventions : `null` signifie « aucune valeur / actif » ; `deletedAt` non nul =
élément à la corbeille (soft delete).

---

## Tâches — lecture

### `list_tasks`
Liste les tâches du tableau. Sans filtre : toutes les tâches actives.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `status` | `Status` | non | Ne garder qu'un statut. |
| `tagId` | `string` | non | Ne garder que les tâches portant cette étiquette (voir list_tags). |
| `trashed` | `boolean` | non | true → liste la corbeille au lieu des tâches actives. |

**Retour** : `Task[]` (JSON).

### `search_tasks`
Recherche insensible à la casse dans le titre, la description et les notes des tâches actives.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `query` | `string (≥ 1 car.)` | **oui** | Terme recherché. |

**Retour** : `Task[]` (JSON).

### `get_task`
Renvoie une tâche complète (notes incluses) par son id.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Identifiant de la tâche. |

**Retour** : `Task` (JSON), ou un message si l'id est introuvable.

---

## Tâches — écriture

### `create_task`
Crée une tâche. Seul le titre est requis.

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `title` | `string (≥ 1 car.)` | **oui** | — | Titre. |
| `description` | `string` | non | — | Description courte. |
| `status` | `Status` | non | `todo` | Colonne du tableau. |
| `priority` | `Priority` | non | `medium` | Priorité. |
| `dueDate` | `date \| null` | non | `null` | Échéance YYYY-MM-DD. |
| `tagIds` | `string[]` | non | — | Ids d'étiquettes existantes (voir list_tags). |
| `notes` | `string` | non | — | Contenu libre de la fiche. |

**Retour** : La `Task` créée (JSON).

### `update_task`
Met à jour les champs fournis (les autres restent inchangés).

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Tâche à modifier. |
| `title` | `string (≥ 1 car.)` | non | Nouveau titre. |
| `description` | `string \| null` | non | null efface la description. |
| `status` | `Status` | non | Nouveau statut. |
| `priority` | `Priority` | non | Nouvelle priorité. |
| `dueDate` | `date \| null` | non | null retire l'échéance. |
| `tagIds` | `string[]` | non | Remplace l'ensemble des étiquettes. |
| `notes` | `string \| null` | non | null efface les notes. |

**Retour** : La `Task` mise à jour (JSON).

### `delete_task`
Met la tâche à la corbeille (suppression douce, réversible via restore_task).

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Tâche à corbeiller. |

**Retour** : Message de confirmation.

### `restore_task`
Restaure une tâche depuis la corbeille.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Tâche à restaurer. |

**Retour** : Message de confirmation.

### `purge_task`
Supprime DÉFINITIVEMENT une tâche. ⚠️ Irréversible — à n'utiliser que sur confirmation explicite de l'utilisateur.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Tâche à supprimer définitivement. |

**Retour** : Message de confirmation.

---

## Étiquettes

### `list_tags`
Liste toutes les étiquettes.

**Aucun paramètre.**

**Retour** : `Tag[]` (JSON).

### `create_tag`
Crée une étiquette.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `name` | `string (≥ 1 car.)` | **oui** | Nom (unique). |
| `color` | `TagColor` | **oui** | Une des 9 couleurs sémantiques. |

**Retour** : Le `Tag` créé (JSON).

### `update_tag`
Renomme et/ou recolore une étiquette.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Étiquette à modifier. |
| `name` | `string (≥ 1 car.)` | non | Nouveau nom. |
| `color` | `TagColor` | non | Nouvelle couleur. |

**Retour** : Le `Tag` mis à jour (JSON).

### `delete_tag`
Supprime une étiquette ; ses liens avec les tâches partent en cascade. ⚠️ Irréversible.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Étiquette à supprimer. |

**Retour** : Message de confirmation.

---

## Todos journalières

### `list_daily_todos`
Liste les todos journalières avec leurs sous-tâches (actives par défaut).

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `date` | `date` | non | Ne garder qu'un jour (YYYY-MM-DD). |
| `trashed` | `boolean` | non | true → liste la corbeille. |

**Retour** : `DailyTodo[]` (JSON).

### `create_daily_todo`
Crée une todo pour un jour donné.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `date` | `date` | **oui** | Jour concerné (YYYY-MM-DD). |
| `title` | `string (≥ 1 car.)` | **oui** | Intitulé. |

**Retour** : Le `DailyTodo` créé (JSON).

### `set_daily_todo_done`
Marque une todo journalière comme faite ou non.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Todo concernée. |
| `done` | `boolean` | **oui** | État coché. |

**Retour** : Message de confirmation.

### `delete_daily_todo`
Met une todo journalière à la corbeille (réversible via restore_daily_todo).

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Todo à corbeiller. |

**Retour** : Message de confirmation.

### `restore_daily_todo`
Restaure une todo journalière depuis la corbeille.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Todo à restaurer. |

**Retour** : Message de confirmation.

### `add_subtask`
Ajoute une sous-tâche à une todo journalière existante.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `dailyTodoId` | `string` | **oui** | Todo parente. |
| `title` | `string (≥ 1 car.)` | **oui** | Intitulé de la sous-tâche. |

**Retour** : Message de confirmation.

### `set_subtask_done`
Marque une sous-tâche comme faite ou non.

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `id` | `string` | **oui** | Sous-tâche concernée. |
| `done` | `boolean` | **oui** | État coché. |

**Retour** : Message de confirmation.

---

## Exemple complet

```json
{
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
}
```

> La liste des outils est aussi introspectable à chaud via la méthode
> `tools/list` (noms, descriptions et schémas d'entrée JSON Schema).
