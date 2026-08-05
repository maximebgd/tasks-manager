"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Task } from "./types";
import { useToast } from "./toast-context";
import {
  createTaskAction,
  purgeTaskAction,
  reorderTasksAction,
  restoreTaskAction,
  softDeleteTaskAction,
  updateTaskAction,
} from "@/app/actions/tasks";

type TasksContextValue = {
  /** Tâches actives (hors corbeille). */
  tasks: Task[];
  /** Tâches à la corbeille, plus récemment supprimées en premier. */
  trashedTasks: Task[];
  /** Ajoute une tâche (en tête) + persiste. */
  addTask: (task: Task) => void;
  /** Met à jour partiellement une tâche + persiste. `successMsg` : toast affiché si la persistance réussit. */
  updateTask: (id: string, patch: Partial<Task>, successMsg?: string) => void;
  /** Met une tâche à la corbeille (soft delete) + toast « Annuler ». */
  deleteTask: (id: string) => void;
  /** Restaure une tâche depuis la corbeille + persiste. */
  restoreTask: (id: string) => void;
  /** Supprime définitivement une tâche de la corbeille (irréversible). */
  purgeTask: (id: string) => void;
  /** Remplace l'ordre complet (drag & drop) + persiste positions/statuts. */
  reorderTasks: (next: Task[]) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

/**
 * Source unique des tâches, montée dans le layout et initialisée avec les
 * données lues en base côté serveur. Les mutations sont appliquées localement
 * (UI optimiste) puis persistées via des Server Actions. En cas d'échec, on
 * annule le changement (rollback) et on affiche un toast d'erreur.
 *
 * On conserve en interne actives + corbeille dans une seule liste (`allTasks`),
 * ce qui préserve les positions : supprimer/restaurer ne fait que basculer
 * `deletedAt`. `tasks` et `trashedTasks` en sont dérivées.
 */
export function TasksProvider({
  initialTasks,
  initialTrashedTasks,
  children,
}: {
  initialTasks: Task[];
  initialTrashedTasks: Task[];
  children: React.ReactNode;
}) {
  const [allTasks, setAllTasks] = useState<Task[]>([
    ...initialTasks,
    ...initialTrashedTasks,
  ]);
  const toast = useToast();

  const tasks = useMemo(() => allTasks.filter((t) => !t.deletedAt), [allTasks]);
  const trashedTasks = useMemo(
    () =>
      allTasks
        .filter((t) => t.deletedAt)
        .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [allTasks],
  );

  // Persiste une mutation ; en cas d'échec, restaure l'état précédent + toast.
  const persist = (run: Promise<unknown>, snapshot: Task[], errMsg: string) => {
    run.catch((e) => {
      console.error(e);
      setAllTasks(snapshot);
      toast.error(errMsg);
    });
  };

  const addTask = (task: Task) => {
    const snapshot = allTasks;
    setAllTasks([task, ...allTasks]);
    persist(
      createTaskAction({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        tagIds: task.tagIds,
        notes: task.notes,
      }).then(() => toast.success("Tâche ajoutée")),
      snapshot,
      "Impossible d'ajouter la tâche",
    );
  };

  const updateTask = (id: string, patch: Partial<Task>, successMsg?: string) => {
    const snapshot = allTasks;
    setAllTasks(allTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    persist(
      updateTaskAction(id, patch).then(() => {
        if (successMsg) toast.success(successMsg);
      }),
      snapshot,
      "Impossible d'enregistrer la modification",
    );
  };

  const deleteTask = (id: string) => {
    const snapshot = allTasks;
    const deletedAt = new Date().toISOString();
    setAllTasks(allTasks.map((t) => (t.id === id ? { ...t, deletedAt } : t)));
    persist(
      softDeleteTaskAction(id).then(() =>
        toast.success("Tâche déplacée dans la corbeille", {
          label: "Annuler",
          onClick: () => restoreTask(id),
        }),
      ),
      snapshot,
      "Impossible de supprimer la tâche",
    );
  };

  const restoreTask = (id: string) => {
    const snapshot = allTasks;
    setAllTasks(
      allTasks.map((t) => (t.id === id ? { ...t, deletedAt: null } : t)),
    );
    persist(
      restoreTaskAction(id).then(() => toast.success("Tâche restaurée")),
      snapshot,
      "Impossible de restaurer la tâche",
    );
  };

  const purgeTask = (id: string) => {
    const snapshot = allTasks;
    setAllTasks(allTasks.filter((t) => t.id !== id));
    persist(
      purgeTaskAction(id).then(() => toast.success("Supprimée définitivement")),
      snapshot,
      "Impossible de supprimer définitivement la tâche",
    );
  };

  const reorderTasks = (next: Task[]) => {
    const snapshot = allTasks;
    // `next` = nouvelle liste des actives ; on préserve les tâches à la corbeille.
    setAllTasks([...next, ...allTasks.filter((t) => t.deletedAt)]);
    persist(
      reorderTasksAction(
        next.map((t, i) => ({ id: t.id, status: t.status, position: i })),
      ),
      snapshot,
      "Impossible de réordonner les tâches",
    );
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        trashedTasks,
        addTask,
        updateTask,
        deleteTask,
        restoreTask,
        purgeTask,
        reorderTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks doit être utilisé dans un TasksProvider");
  return ctx;
}
