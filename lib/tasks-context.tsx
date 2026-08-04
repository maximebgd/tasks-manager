"use client";

import { createContext, useContext, useState } from "react";
import type { Task } from "./types";
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
  /** Met à jour partiellement une tâche + persiste. */
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  /** Remplace l'ordre complet (drag & drop) + persiste positions/statuts. */
  reorderTasks: (next: Task[]) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

const logError = (e: unknown) => console.error("Échec de persistance :", e);

/**
 * Source unique des tâches, montée dans le layout et initialisée avec les
 * données lues en base côté serveur. Les mutations sont appliquées localement
 * (UI optimiste) puis persistées via des Server Actions.
 */
export function TasksProvider({
  initialTasks,
  children,
}: {
  initialTasks: Task[];
  children: React.ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    createTaskAction({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      tags: task.tags,
      notes: task.notes,
    }).catch(logError);
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    updateTaskAction(id, patch).catch(logError);
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    deleteTaskAction(id).catch(logError);
  };

  const reorderTasks = (next: Task[]) => {
    setTasks(next);
    reorderTasksAction(
      next.map((t, i) => ({ id: t.id, status: t.status, position: i })),
    ).catch(logError);
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
