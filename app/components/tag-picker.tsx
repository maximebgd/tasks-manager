"use client";

import { useEffect, useRef, useState } from "react";
import type { TagColor } from "@/lib/types";
import { TAG_COLORS } from "@/lib/types";
import { useTags } from "@/lib/tags-context";
import { tagColorClass, tagDotClass } from "./badges";

/**
 * Sélecteur d'étiquettes réutilisable (fiche + formulaire de création).
 * Gère l'assignation à la tâche courante ET le CRUD complet des étiquettes
 * (créer, renommer, recolorier, supprimer) via le store partagé `useTags`.
 */
export function TagPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { tags, getTag, addTag, updateTag, deleteTag } = useTags();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Ferme le popover au clic extérieur ou sur Échap.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const assigned = selectedIds
    .map((id) => getTag(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const q = query.trim().toLowerCase();
  const filtered = q
    ? tags.filter((t) => t.name.toLowerCase().includes(q))
    : tags;
  const exactMatch = tags.some((t) => t.name.toLowerCase() === q);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  function createAndAssign() {
    const name = query.trim();
    if (!name) return;
    // Couleur par défaut tournante pour varier les nouvelles étiquettes.
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    const tag = addTag(name, color);
    onChange([...selectedIds, tag.id]);
    setQuery("");
  }

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditName(name);
  }

  function commitEditName() {
    if (editingId && editName.trim()) {
      updateTag(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  }

  function remove(id: string) {
    if (!window.confirm("Supprimer cette étiquette de toutes les tâches ?"))
      return;
    deleteTag(id);
    onChange(selectedIds.filter((x) => x !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {assigned.map((t) => (
          <span
            key={t.id}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${tagColorClass[t.color]}`}
          >
            {t.name}
            <button
              type="button"
              onClick={() => toggle(t.id)}
              aria-label={`Retirer ${t.name}`}
              className="opacity-60 transition hover:opacity-100"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded border border-dashed border-line-strong px-1.5 py-0.5 text-xs text-muted transition hover:border-accent hover:text-content"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Étiquette
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-72 rounded-lg border border-line bg-surface p-2 shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q && !exactMatch) {
                e.preventDefault();
                createAndAssign();
              }
            }}
            placeholder="Rechercher ou créer…"
            className="mb-1.5 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-sm text-content outline-none transition focus:border-accent"
          />

          <div className="max-h-60 overflow-y-auto">
            {filtered.map((t) => {
              const isAssigned = selectedIds.includes(t.id);
              const isEditing = editingId === t.id;
              return (
                <div
                  key={t.id}
                  className="group flex items-center gap-1 rounded px-1 py-0.5"
                >
                  {isEditing ? (
                    <div className="flex w-full flex-col gap-1.5">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEditName();
                        }}
                        onBlur={commitEditName}
                        className="w-full rounded border border-accent bg-surface-muted px-1.5 py-1 text-sm text-content outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-1.5">
                        {TAG_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            aria-label={`Couleur ${c}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => updateTag(t.id, { color: c })}
                            className={`h-4 w-4 rounded-full ${tagDotClass[c]} ${
                              t.color === c
                                ? "ring-2 ring-accent ring-offset-1 ring-offset-surface"
                                : ""
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => toggle(t.id)}
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm text-content"
                      >
                        <span
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${tagDotClass[t.color]}`}
                        >
                          {isAssigned && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{t.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(t.id, t.name)}
                        aria-label="Modifier l'étiquette"
                        className="shrink-0 rounded p-1 text-faint opacity-0 transition hover:bg-surface-hover hover:text-content group-hover:opacity-100"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(t.id)}
                        aria-label="Supprimer l'étiquette"
                        className="shrink-0 rounded p-1 text-faint opacity-0 transition hover:bg-tag-red hover:text-tag-red-text group-hover:opacity-100"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {q && !exactMatch && (
              <button
                type="button"
                onClick={createAndAssign}
                className="flex w-full items-center gap-1.5 rounded px-1.5 py-1.5 text-left text-sm text-accent transition hover:bg-surface-hover"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Créer «&nbsp;{query.trim()}&nbsp;»
              </button>
            )}

            {filtered.length === 0 && !q && (
              <p className="px-1.5 py-2 text-xs text-faint">
                Aucune étiquette. Tapez pour en créer une.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
