"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastType = "success" | "error";
/** Bouton d'action optionnel (ex. « Annuler ») affiché dans le toast. */
type ToastAction = { label: string; onClick: () => void };
type Toast = {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
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
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback(
    (id: number) => setToasts((list) => list.filter((t) => t.id !== id)),
    [],
  );

  const push = useCallback(
    (type: ToastType, message: string, action?: ToastAction) => {
      const id = ++counter;
      setToasts((list) => [...list, { id, type, message, action }]);
      // Les toasts avec action (ex. « Annuler ») restent un peu plus longtemps.
      setTimeout(() => remove(id), action ? 6000 : 3500);
    },
    [remove],
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
            </button>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  remove(t.id);
                }}
                className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-accent transition duration-200 ease-smooth hover:bg-surface-hover active:scale-95"
              >
                {t.action.label}
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
