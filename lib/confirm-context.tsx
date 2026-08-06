"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ConfirmOptions = {
  /** Titre en gras (défaut « Confirmer »). */
  title?: string;
  /** Corps du message (peut décrire l'irréversibilité). */
  message: string;
  /** Libellé du bouton de confirmation (défaut « Confirmer »). */
  confirmLabel?: string;
  /** Libellé du bouton d'annulation (défaut « Annuler »). */
  cancelLabel?: string;
  /** Style destructif (bouton rouge) pour les suppressions. */
  danger?: boolean;
};

type ConfirmApi = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmApi | null>(null);

/**
 * Dialogue de confirmation propre à l'app (remplace `window.confirm`). Monté
 * dans le layout, il expose `confirm(options)` qui renvoie une Promise<boolean>.
 * Stylé avec les tokens du thème → jour/nuit automatique. Échap / clic hors du
 * dialogue = annuler, Entrée = confirmer.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmApi>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [options, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          onClick={() => close(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-md animate-[overlay-in_200ms_ease-out]"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-pop animate-[pop-in_260ms_var(--ease-spring)]"
          >
            <h2 className="text-base font-semibold text-content">
              {options.title ?? "Confirmer"}
            </h2>
            <p className="mt-1.5 text-sm text-muted">{options.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-muted transition duration-200 ease-smooth hover:bg-surface-hover hover:text-content active:scale-95"
              >
                {options.cancelLabel ?? "Annuler"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold text-white shadow-card transition duration-200 ease-spring hover:shadow-lift hover:brightness-105 active:scale-95 ${
                  options.danger ? "bg-danger" : "bg-accent"
                }`}
              >
                {options.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx)
    throw new Error("useConfirm doit être utilisé dans un ConfirmProvider");
  return ctx;
}
