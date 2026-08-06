"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * État de synchronisation avec la BDD, agrégé sur toutes les mutations en cours.
 * - `idle` : tout est persisté, rien en attente.
 * - `syncing` : au moins une mutation est en cours d'écriture en base.
 * - `saved` : flash transitoire juste après qu'une salve de mutations a réussi.
 * - `error` : la dernière mutation a échoué (l'état a été restauré par le contexte concerné).
 */
export type SyncStatus = "idle" | "syncing" | "saved" | "error";

type SyncContextValue = {
  status: SyncStatus;
  /**
   * Suit une mutation persistée : incrémente le compteur en cours, puis le
   * décrémente à la résolution. En cas d'échec, bascule en `error`. Renvoie la
   * promesse telle quelle pour pouvoir la chaîner.
   */
  track: <T>(promise: Promise<T>) => Promise<T>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

/** Durée du flash « Synchronisé » après une salve de mutations réussie (ms). */
const SAVED_FLASH_MS = 1800;

/**
 * Fournit un état de synchronisation partagé, consommé par l'indicateur dans la
 * nav. Monté au-dessus des providers de données (tasks/tags/daily) pour que leur
 * helper `persist` puisse envelopper chaque écriture via `track`.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);
  const [error, setError] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Nombre de mutations en cours, hors état React pour éviter les courses.
  const pendingRef = useRef(0);

  const track = useCallback(<T,>(promise: Promise<T>): Promise<T> => {
    pendingRef.current += 1;
    setPending(pendingRef.current);
    setError(false);
    setSavedFlash(false);

    const settle = (failed: boolean) => {
      pendingRef.current -= 1;
      setPending(pendingRef.current);
      if (failed) {
        setError(true);
      } else if (pendingRef.current === 0) {
        // Toute la salve est passée : flash « Synchronisé ».
        setSavedFlash(true);
      }
    };

    promise.then(
      () => settle(false),
      () => settle(true),
    );
    return promise;
  }, []);

  // Retombe en `idle` après le flash « Synchronisé ».
  useEffect(() => {
    if (!savedFlash) return;
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedFlash(false), SAVED_FLASH_MS);
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, [savedFlash]);

  const status: SyncStatus = pending > 0
    ? "syncing"
    : error
      ? "error"
      : savedFlash
        ? "saved"
        : "idle";

  const value = useMemo<SyncContextValue>(() => ({ status, track }), [status, track]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync doit être utilisé dans un SyncProvider");
  return ctx;
}
