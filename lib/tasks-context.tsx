"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "./types";
import { useToast } from "./toast-context";
import { useSync } from "./sync-context";
import { useLocale } from "./i18n/task-ui";
import {
  createTaskAction,
  purgeTaskAction,
  reorderTasksAction,
  restoreTaskAction,
  softDeleteTaskAction,
  updateTaskAction,
  getTaskSnapshotAction,
} from "@/app/actions/tasks";
import { createTaskSyncState, finishTaskMutation, receiveTaskSnapshot, recordPollingFailure, recordPollingSuccess, type TaskSyncState } from "./tasks-sync";

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
  stale: boolean;
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
  const locale = useLocale();
  const message = (fr: string, es: string) => locale === "es" ? es : fr;
  const sync = useSync();
  const [syncState, setSyncState] = useState<TaskSyncState>(() => ({ ...createTaskSyncState(), active: initialTasks, trashed: initialTrashedTasks }));
  const syncStateRef = useRef(syncState);
  const updateSyncState = (next: TaskSyncState) => { syncStateRef.current = next; setSyncState(next); };

  const tasks = useMemo(() => allTasks.filter((t) => !t.deletedAt), [allTasks]);
  const trashedTasks = useMemo(
    () =>
      allTasks
        .filter((t) => t.deletedAt)
        .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [allTasks],
  );

  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const snapshot = await getTaskSnapshotAction();
        if (!active) return;
        updateSyncState(recordPollingSuccess(receiveTaskSnapshot(syncStateRef.current, snapshot)));
        const state = syncStateRef.current;
        if (state.pendingMutations === 0 && !state.deferredSnapshot) setAllTasks([...state.active, ...state.trashed]);
      } catch {
        if (active) updateSyncState(recordPollingFailure(syncStateRef.current));
      }
    };
    const becameVisible = () => { if (document.visibilityState === "visible") void poll(); };
    if (document.visibilityState === "visible") void poll();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void poll(); }, 5000);
    document.addEventListener("visibilitychange", becameVisible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", becameVisible); };
  }, []);

  // Writes remain tracked; external snapshots wait until the final optimistic write settles.
  const persist = (run: Promise<unknown>, snapshot: Task[], errMsg: string) => {
    updateSyncState({ ...syncStateRef.current, pendingMutations: syncStateRef.current.pendingMutations + 1 });
    sync.track(run).catch((e) => {
      console.error(e);
      setAllTasks(snapshot);
      toast.error(errMsg);
    }).finally(() => {
      const { state: next, snapshotApplied } = finishTaskMutation(syncStateRef.current);
      updateSyncState(next);
      if (snapshotApplied) setAllTasks([...next.active, ...next.trashed]);
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
      }).then(() => toast.success(message("Tâche ajoutée", "Tarea añadida"))),
      snapshot,
      message("Impossible d'ajouter la tâche", "No se pudo añadir la tarea"),
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
      message("Impossible d'enregistrer la modification", "No se pudo guardar el cambio"),
    );
  };

  const deleteTask = (id: string) => {
    const snapshot = allTasks;
    const deletedAt = new Date().toISOString();
    setAllTasks(allTasks.map((t) => (t.id === id ? { ...t, deletedAt } : t)));
    persist(
      softDeleteTaskAction(id).then(() =>
        toast.success(message("Tâche déplacée dans la corbeille", "Tarea movida a la papelera"), {
          label: message("Annuler", "Deshacer"),
          onClick: () => restoreTask(id),
        }),
      ),
      snapshot,
      message("Impossible de supprimer la tâche", "No se pudo eliminar la tarea"),
    );
  };

  const restoreTask = (id: string) => {
    const snapshot = allTasks;
    // Updater fonctionnel : un « Annuler » groupé enchaîne plusieurs restaurations
    // dans le même tick sans que la dernière n'écrase les précédentes.
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, deletedAt: null } : t)),
    );
    persist(
      restoreTaskAction(id).then(() => toast.success(message("Tâche restaurée", "Tarea restaurada"))),
      snapshot,
      message("Impossible de restaurer la tâche", "No se pudo restaurar la tarea"),
    );
  };

  const purgeTask = (id: string) => {
    const snapshot = allTasks;
    setAllTasks(allTasks.filter((t) => t.id !== id));
    persist(
      purgeTaskAction(id).then(() => toast.success(message("Supprimée définitivement", "Eliminada definitivamente"))),
      snapshot,
      message("Impossible de supprimer définitivement la tâche", "No se pudo eliminar la tarea definitivamente"),
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
      message("Impossible de réordonner les tâches", "No se pudo reordenar las tareas"),
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
        stale: syncState.stale,
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
