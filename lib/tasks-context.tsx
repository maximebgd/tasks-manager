"use client";

import { createContext, useContext, useState } from "react";
import type { Task } from "./types";
import { useToast } from "./toast-context";
import {
  createTaskAction,
  deleteTaskAction,
  reorderTasksAction,
  updateTaskAction,
} from "@/app/actions/tasks";

type TasksContextValue = {
  tasks: Task[];
  /** Ajoute une tâche (en tête) + persiste. */
  addTask: (task: Task) => void;
  /** Met à jour partiellement une tâche + persiste. `successMsg` : toast affiché si la persistance réussit. */
  updateTask: (id: string, patch: Partial<Task>, successMsg?: string) => void;
  deleteTask: (id: string) => void;
  /** Remplace l'ordre complet (drag & drop) + persiste positions/statuts. */
  reorderTasks: (next: Task[]) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

/**
 * Source unique des tâches, montée dans le layout et initialisée avec les
 * données lues en base côté serveur. Les mutations sont appliquées localement
 * (UI optimiste) puis persistées via des Server Actions. En cas d'échec, on
 * annule le changement (rollback) et on affiche un toast d'erreur.
 */
export function TasksProvider({
  initialTasks,
  children,
}: {
  initialTasks: Task[];
  children: React.ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const toast = useToast();

  // Persiste une mutation ; en cas d'échec, restaure l'état précédent + toast.
  const persist = (run: Promise<unknown>, snapshot: Task[], errMsg: string) => {
    run.catch((e) => {
      console.error(e);
      setTasks(snapshot);
      toast.error(errMsg);
    });
  };

  const addTask = (task: Task) => {
    const snapshot = tasks;
    setTasks([task, ...tasks]);
    persist(
      createTaskAction({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        tags: task.tags,
        notes: task.notes,
      }).then(() => toast.success("Tâche ajoutée")),
      snapshot,
      "Impossible d'ajouter la tâche",
    );
  };

  const updateTask = (id: string, patch: Partial<Task>, successMsg?: string) => {
    const snapshot = tasks;
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    persist(
      updateTaskAction(id, patch).then(() => {
        if (successMsg) toast.success(successMsg);
      }),
      snapshot,
      "Impossible d'enregistrer la modification",
    );
  };

  const deleteTask = (id: string) => {
    const snapshot = tasks;
    setTasks(tasks.filter((t) => t.id !== id));
    persist(
      deleteTaskAction(id).then(() => toast.success("Tâche supprimée")),
      snapshot,
      "Impossible de supprimer la tâche",
    );
  };

  const reorderTasks = (next: Task[]) => {
    const snapshot = tasks;
    setTasks(next);
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
      value={{ tasks, addTask, updateTask, deleteTask, reorderTasks }}
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
