"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastType = "success" | "error";
type Toast = { id: number; type: ToastType; message: string };
type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
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
    (type: ToastType, message: string) => {
      const id = ++counter;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => remove(t.id)}
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-left text-sm text-content shadow-lg animate-[toast-in_150ms_ease-out]"
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
