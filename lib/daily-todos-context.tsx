"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DailyTodo, SubTodo } from "./types";
import { useToast } from "./toast-context";
import { useSync } from "./sync-context";
import { useLocale } from "./i18n/task-ui";
import { remainingText } from "./i18n/remaining";
import {
  createDailyTodoAction,
  setDailyTodoDoneAction,
  softDeleteDailyTodoAction,
  restoreDailyTodoAction,
  purgeDailyTodoAction,
  reorderDailyTodosAction,
  createSubtaskAction,
  setSubtaskDoneAction,
  softDeleteSubtaskAction,
  restoreSubtaskAction,
  purgeSubtaskAction,
  reorderSubtasksAction,
} from "@/app/actions/daily";

/** Sous-tâche à la corbeille, rattachée au titre de sa todo parente (encore active). */
export type TrashedSubtask = {
  parentId: string;
  parentTitle: string;
  subtask: SubTodo;
};

type DailyTodosContextValue = {
  /** Todos actives (hors corbeille), sous-tâches actives uniquement. */
  dailyTodos: DailyTodo[];
  /** Todos à la corbeille, plus récemment supprimées en premier. */
  trashedDailyTodos: DailyTodo[];
  /** Sous-tâches supprimées seules (parente encore active), plus récentes en premier. */
  trashedSubtasks: TrashedSubtask[];
  addTodo: (input: { id: string; date: string; title: string }) => void;
  toggleTodo: (id: string) => void;
  /** Met une todo à la corbeille (soft delete) + toast « Annuler ». */
  deleteTodo: (id: string) => void;
  restoreTodo: (id: string) => void;
  purgeTodo: (id: string) => void;
  /** Réordonne les todos actives (drag & drop) + persiste les positions. */
  reorderTodos: (next: DailyTodo[]) => void;
  addSubtask: (input: {
    id: string;
    parentId: string;
    title: string;
  }) => void;
  toggleSubtask: (parentId: string, subId: string) => void;
  /** Met une sous-tâche à la corbeille (soft delete) + toast « Annuler ». */
  deleteSubtask: (parentId: string, subId: string) => void;
  restoreSubtask: (subId: string) => void;
  purgeSubtask: (subId: string) => void;
  /** Réordonne les sous-tâches actives d'une todo + persiste les positions. */
  reorderSubtasks: (parentId: string, next: SubTodo[]) => void;
};

const DailyTodosContext = createContext<DailyTodosContextValue | null>(null);

/**
 * Source unique des todos journalières, montée dans le layout et initialisée
 * avec les données lues en base côté serveur. Même pattern que `TasksProvider` :
 * mutations optimistes puis persistées ; rollback + toast en cas d'échec.
 *
 * On garde en interne l'ensemble complet (actives + corbeille) dans une seule
 * liste imbriquée `allTodos`, chaque todo ET chaque sous-tâche portant son
 * propre `deletedAt`. Supprimer/restaurer ne fait que basculer ce champ, ce qui
 * préserve les positions et permet à une sous-tâche d'être à la corbeille alors
 * que sa todo parente reste active. Les vues sont dérivées de cette liste.
 */
export function DailyTodosProvider({
  initialTodos,
  children,
}: {
  initialTodos: DailyTodo[];
  children: React.ReactNode;
}) {
  const [allTodos, setAllTodos] = useState<DailyTodo[]>(initialTodos);
  const toast = useToast();
  const sync = useSync();
  const locale = useLocale();

  const dailyTodos = useMemo(
    () =>
      allTodos
        .filter((t) => !t.deletedAt)
        .map((t) => ({
          ...t,
          subtasks: t.subtasks.filter((s) => !s.deletedAt),
        })),
    [allTodos],
  );

  const trashedDailyTodos = useMemo(
    () =>
      allTodos
        .filter((t) => t.deletedAt)
        .map((t) => ({
          ...t,
          subtasks: t.subtasks.filter((s) => !s.deletedAt),
        }))
        .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [allTodos],
  );

  const trashedSubtasks = useMemo<TrashedSubtask[]>(
    () =>
      allTodos
        .filter((t) => !t.deletedAt)
        .flatMap((t) =>
          t.subtasks
            .filter((s) => s.deletedAt)
            .map((s) => ({ parentId: t.id, parentTitle: t.title, subtask: s })),
        )
        .sort((a, b) =>
          (b.subtask.deletedAt ?? "").localeCompare(a.subtask.deletedAt ?? ""),
        ),
    [allTodos],
  );

  // Persiste une mutation ; en cas d'échec, restaure l'état précédent + toast.
  const persist = (
    run: Promise<unknown>,
    snapshot: DailyTodo[],
    errMsg: string,
  ) => {
    sync.track(run).catch((e) => {
      console.error(e);
      setAllTodos(snapshot);
      toast.error(errMsg);
    });
  };

  // Applique une transformation à la sous-tâche `subId` (toutes todos confondues).
  const mapSub = (
    subId: string,
    fn: (s: SubTodo) => SubTodo,
  ): DailyTodo[] =>
    allTodos.map((t) => ({
      ...t,
      subtasks: t.subtasks.map((s) => (s.id === subId ? fn(s) : s)),
    }));

  const addTodo = (input: { id: string; date: string; title: string }) => {
    const snapshot = allTodos;
    setAllTodos([
      ...allTodos,
      {
        id: input.id,
        date: input.date,
        title: input.title,
        done: false,
        subtasks: [],
        deletedAt: null,
      },
    ]);
    persist(
      createDailyTodoAction(input),
      snapshot,
      remainingText(locale, "toastTodoAdded"),
    );
  };

  const toggleTodo = (id: string) => {
    const current = allTodos.find((t) => t.id === id);
    if (!current) return;
    const done = !current.done;
    const snapshot = allTodos;
    setAllTodos(allTodos.map((t) => (t.id === id ? { ...t, done } : t)));
    persist(
      setDailyTodoDoneAction(id, done),
      snapshot,
      remainingText(locale, "toastTodoSaved"),
    );
  };

  const deleteTodo = (id: string) => {
    const snapshot = allTodos;
    const deletedAt = new Date().toISOString();
    setAllTodos(allTodos.map((t) => (t.id === id ? { ...t, deletedAt } : t)));
    persist(
      softDeleteDailyTodoAction(id).then(() =>
        toast.success(remainingText(locale, "toastTodoDeleted"), {
          label: remainingText(locale, "undo"),
          onClick: () => restoreTodo(id),
        }),
      ),
      snapshot,
      remainingText(locale, "toastTodoDeleteError"),
    );
  };

  const restoreTodo = (id: string) => {
    const snapshot = allTodos;
    // Updater fonctionnel : un « Annuler » groupé enchaîne plusieurs restaurations
    // dans le même tick sans que la dernière n'écrase les précédentes.
    setAllTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, deletedAt: null } : t)),
    );
    persist(
      restoreDailyTodoAction(id).then(() => toast.success(remainingText(locale, "toastTodoRestored"))),
      snapshot,
      remainingText(locale, "toastRestoreError"),
    );
  };

  const purgeTodo = (id: string) => {
    const snapshot = allTodos;
    setAllTodos(allTodos.filter((t) => t.id !== id));
    persist(
      purgeDailyTodoAction(id).then(() =>
        toast.success(remainingText(locale, "toastPurged")),
      ),
      snapshot,
      remainingText(locale, "toastPurgeError"),
    );
  };

  const reorderTodos = (next: DailyTodo[]) => {
    const snapshot = allTodos;
    // `next` = nouvelles todos actives ; on préserve celles à la corbeille.
    setAllTodos([...next, ...allTodos.filter((t) => t.deletedAt)]);
    persist(
      reorderDailyTodosAction(next.map((t, i) => ({ id: t.id, position: i }))),
      snapshot,
      remainingText(locale, "toastReorderError"),
    );
  };

  const addSubtask = (input: {
    id: string;
    parentId: string;
    title: string;
  }) => {
    const snapshot = allTodos;
    setAllTodos(
      allTodos.map((t) =>
        t.id === input.parentId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                { id: input.id, title: input.title, done: false, deletedAt: null },
              ],
            }
          : t,
      ),
    );
    persist(
      createSubtaskAction({
        id: input.id,
        dailyTodoId: input.parentId,
        title: input.title,
      }),
      snapshot,
      remainingText(locale, "toastSubtaskAdded"),
    );
  };

  const toggleSubtask = (parentId: string, subId: string) => {
    const sub = allTodos
      .find((t) => t.id === parentId)
      ?.subtasks.find((s) => s.id === subId);
    if (!sub) return;
    const done = !sub.done;
    const snapshot = allTodos;
    setAllTodos(mapSub(subId, (s) => ({ ...s, done })));
    persist(
      setSubtaskDoneAction(subId, done),
      snapshot,
      remainingText(locale, "toastSubtaskSaved"),
    );
  };

  const deleteSubtask = (parentId: string, subId: string) => {
    const snapshot = allTodos;
    const deletedAt = new Date().toISOString();
    setAllTodos(mapSub(subId, (s) => ({ ...s, deletedAt })));
    persist(
      softDeleteSubtaskAction(subId).then(() =>
        toast.success(remainingText(locale, "toastSubtaskDeleted"), {
          label: remainingText(locale, "undo"),
          onClick: () => restoreSubtask(subId),
        }),
      ),
      snapshot,
      remainingText(locale, "toastSubtaskDeleteError"),
    );
  };

  const restoreSubtask = (subId: string) => {
    const snapshot = allTodos;
    // Updater fonctionnel : un « Annuler » groupé enchaîne plusieurs restaurations
    // dans le même tick sans que la dernière n'écrase les précédentes.
    setAllTodos((prev) =>
      prev.map((t) => ({
        ...t,
        subtasks: t.subtasks.map((s) =>
          s.id === subId ? { ...s, deletedAt: null } : s,
        ),
      })),
    );
    persist(
      restoreSubtaskAction(subId).then(() =>
        toast.success(remainingText(locale, "toastSubtaskRestored")),
      ),
      snapshot,
      remainingText(locale, "toastRestoreError"),
    );
  };

  const purgeSubtask = (subId: string) => {
    const snapshot = allTodos;
    setAllTodos(
      allTodos.map((t) => ({
        ...t,
        subtasks: t.subtasks.filter((s) => s.id !== subId),
      })),
    );
    persist(
      purgeSubtaskAction(subId).then(() =>
        toast.success(remainingText(locale, "toastPurged")),
      ),
      snapshot,
      remainingText(locale, "toastSubtaskPurgeError"),
    );
  };

  const reorderSubtasks = (parentId: string, next: SubTodo[]) => {
    const snapshot = allTodos;
    // `next` = sous-tâches actives réordonnées ; on préserve celles à la corbeille.
    setAllTodos(
      allTodos.map((t) =>
        t.id === parentId
          ? { ...t, subtasks: [...next, ...t.subtasks.filter((s) => s.deletedAt)] }
          : t,
      ),
    );
    persist(
      reorderSubtasksAction(next.map((s, i) => ({ id: s.id, position: i }))),
      snapshot,
      remainingText(locale, "toastSubtaskReorderError"),
    );
  };

  return (
    <DailyTodosContext.Provider
      value={{
        dailyTodos,
        trashedDailyTodos,
        trashedSubtasks,
        addTodo,
        toggleTodo,
        deleteTodo,
        restoreTodo,
        purgeTodo,
        reorderTodos,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        restoreSubtask,
        purgeSubtask,
        reorderSubtasks,
      }}
    >
      {children}
    </DailyTodosContext.Provider>
  );
}

export function useDailyTodos() {
  const ctx = useContext(DailyTodosContext);
  if (!ctx)
    throw new Error(
      "useDailyTodos doit être utilisé dans un DailyTodosProvider",
    );
  return ctx;
}
