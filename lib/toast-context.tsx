"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error";
/** Bouton d'action optionnel (ex. « Annuler ») affiché dans le toast. */
type ToastAction = { label: string; onClick: () => void };
type Toast = {
  id: number;
  type: ToastType;
  message: string;
  /** Nombre de notifications identiques regroupées dans ce toast. */
  count: number;
  actionLabel?: string;
  /** Callbacks d'action accumulés (une par notification regroupée). */
  actions: (() => void)[];
};
type ToastApi = {
  success: (message: string, action?: ToastAction) => void;
  error: (message: string, action?: ToastAction) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

let counter = 0;

/**
 * Notifications légères, stylées avec les tokens du thème (donc jour/nuit
 * automatique). Montée dans le layout, au-dessus des autres providers.
 *
 * Les toasts de même type + message sont **regroupés** en une seule carte avec
 * un compteur, au lieu de s'empiler : une suppression en masse n'affiche donc
 * qu'un toast « ×N », et « Annuler » restaure l'ensemble du lot.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Miroir synchrone de `toasts` pour décider du regroupement hors du updater.
  const toastsRef = useRef<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const commit = useCallback((next: Toast[]) => {
    toastsRef.current = next;
    setToasts(next);
  }, []);

  const remove = useCallback(
    (id: number) => {
      const timer = timers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
      commit(toastsRef.current.filter((t) => t.id !== id));
    },
    [commit],
  );

  const scheduleRemoval = useCallback(
    (id: number, delay: number) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      timers.current.set(id, setTimeout(() => remove(id), delay));
    },
    [remove],
  );

  const push = useCallback(
    (type: ToastType, message: string, action?: ToastAction) => {
      // Les toasts avec action (ex. « Annuler ») restent un peu plus longtemps.
      const delay = action ? 6000 : 3500;
      const existing = toastsRef.current.find(
        (t) => t.type === type && t.message === message,
      );
      if (existing) {
        commit(
          toastsRef.current.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  count: t.count + 1,
                  actionLabel: action?.label ?? t.actionLabel,
                  actions: action ? [...t.actions, action.onClick] : t.actions,
                }
              : t,
          ),
        );
        // Le compteur repart : on prolonge la durée d'affichage.
        scheduleRemoval(existing.id, delay);
        return;
      }
      const id = ++counter;
      commit([
        ...toastsRef.current,
        {
          id,
          type,
          message,
          count: 1,
          actionLabel: action?.label,
          actions: action ? [action.onClick] : [],
        },
      ]);
      scheduleRemoval(id, delay);
    },
    [commit, scheduleRemoval],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, action) => push("success", m, action),
      error: (m, action) => push("error", m, action),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass pointer-events-auto flex items-center gap-2.5 rounded-xl border border-glass-border px-3.5 py-2.5 text-sm text-content shadow-pop animate-[toast-in_200ms_var(--ease-spring)]"
          >
            <button
              onClick={() => remove(t.id)}
              className="flex flex-1 items-center gap-2.5 text-left"
            >
              {t.type === "success" ? (
                <svg className="shrink-0 text-tag-green-text" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg className="shrink-0 text-tag-red-text" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
              )}
              <span className="flex-1">{t.message}</span>
              {t.count > 1 && (
                <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted">
                  ×{t.count}
                </span>
              )}
            </button>
            {t.actionLabel && t.actions.length > 0 && (
              <button
                onClick={() => {
                  t.actions.forEach((fn) => fn());
                  remove(t.id);
                }}
                className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-accent transition duration-200 ease-smooth hover:bg-surface-hover active:scale-95"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un ToastProvider");
  return ctx;
}
