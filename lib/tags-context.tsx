"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Tag, TagColor } from "./types";
import { useToast } from "./toast-context";
import { useSync } from "./sync-context";
import { useLocale } from "./i18n/task-ui";
import {
  createTagAction,
  deleteTagAction,
  reorderTagsAction,
  updateTagAction,
} from "@/app/actions/tags";

type TagsContextValue = {
  tags: Tag[];
  /** Résout un id d'étiquette en objet (ou undefined si supprimée). */
  getTag: (id: string) => Tag | undefined;
  /** Crée une étiquette + persiste. Renvoie le tag créé (id généré côté client). */
  addTag: (name: string, color: TagColor) => Tag;
  /** Renomme / recolorie une étiquette + persiste. */
  updateTag: (id: string, patch: { name?: string; color?: TagColor }) => void;
  /** Supprime une étiquette (retirée de toutes les tâches) + persiste. */
  deleteTag: (id: string) => void;
  /** Remplace l'ordre complet des étiquettes (drag & drop) + persiste. */
  reorderTags: (next: Tag[]) => void;
};

const TagsContext = createContext<TagsContextValue | null>(null);

/**
 * Store partagé des étiquettes, monté dans le layout et initialisé depuis la
 * base. Mêmes principes que les tâches : mutations optimistes puis persistées,
 * rollback + toast en cas d'échec. Les tâches ne stockent que des ids de tags ;
 * nom et couleur sont résolus ici, donc un renommage/recoloriage se reflète
 * partout instantanément.
 */
export function TagsProvider({
  initialTags,
  children,
}: {
  initialTags: Tag[];
  children: React.ReactNode;
}) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const toast = useToast();
  const locale = useLocale();
  const message = (fr: string, es: string) => locale === "es" ? es : fr;
  const sync = useSync();

  const byId = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  const persist = (run: Promise<unknown>, snapshot: Tag[], errMsg: string) => {
    sync.track(run).catch((e) => {
      console.error(e);
      setTags(snapshot);
      toast.error(errMsg);
    });
  };

  const getTag = (id: string) => byId.get(id);

  const addTag = (name: string, color: TagColor): Tag => {
    const tag: Tag = { id: crypto.randomUUID(), name, color };
    const snapshot = tags;
    setTags([...tags, tag]);
    persist(
      createTagAction(tag),
      snapshot,
      message("Impossible de créer l'étiquette", "No se pudo crear la etiqueta"),
    );
    return tag;
  };

  const updateTag = (id: string, patch: { name?: string; color?: TagColor }) => {
    const snapshot = tags;
    setTags(tags.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    persist(
      updateTagAction(id, patch),
      snapshot,
      message("Impossible de modifier l'étiquette", "No se pudo modificar la etiqueta"),
    );
  };

  const deleteTag = (id: string) => {
    const snapshot = tags;
    setTags(tags.filter((t) => t.id !== id));
    persist(
      deleteTagAction(id).then(() => toast.success(message("Étiquette supprimée", "Etiqueta eliminada"))),
      snapshot,
      message("Impossible de supprimer l'étiquette", "No se pudo eliminar la etiqueta"),
    );
  };

  const reorderTags = (next: Tag[]) => {
    const snapshot = tags;
    setTags(next);
    persist(
      reorderTagsAction(next.map((t, i) => ({ id: t.id, position: i }))),
      snapshot,
      message("Impossible de réordonner les étiquettes", "No se pudo reordenar las etiquetas"),
    );
  };

  return (
    <TagsContext.Provider
      value={{ tags, getTag, addTag, updateTag, deleteTag, reorderTags }}
    >
      {children}
    </TagsContext.Provider>
  );
}

export function useTags() {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error("useTags doit être utilisé dans un TagsProvider");
  return ctx;
}
