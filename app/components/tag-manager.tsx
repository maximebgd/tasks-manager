"use client";

import { useEffect, useRef, useState } from "react";
import { TAG_COLORS } from "@/lib/types";
import { useTags } from "@/lib/tags-context";
import { useConfirm } from "@/lib/confirm-context";
import { tagDotClass } from "./badges";

/**
 * Panneau global de gestion des étiquettes (bouton « Gérer » + popover),
 * monté dans la rangée « Tags » du tableau. Liste TOUTES les étiquettes
 * (y compris les orphelines) dans l'ordre d'affichage et permet de les
 * renommer, recolorier, supprimer, réordonner (drag & drop) et créer.
 * Toute la persistance passe par le store partagé `useTags`.
 */
export function TagManager() {
  const { tags, addTag, updateTag, deleteTag, reorderTags } = useTags();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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

  async function remove(id: string, name: string) {
    const ok = await confirm({
      title: "Supprimer l'étiquette",
      message: `« ${name} » sera retirée de toutes les tâches. Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    deleteTag(id);
    if (editingId === id) setEditingId(null);
  }

  function createTag() {
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    // Nom par défaut unique (contrainte @unique sur Tag.name).
    const base = "Nouvelle étiquette";
    const taken = new Set(tags.map((t) => t.name));
    let name = base;
    for (let i = 2; taken.has(name); i++) name = `${base} ${i}`;
    const tag = addTag(name, color);
    startEdit(tag.id, tag.name);
  }

  // Déplace l'étiquette glissée juste avant `targetId`, puis persiste.
  function moveTag(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const next = tags.filter((t) => t.id !== draggingId);
    const dragged = tags.find((t) => t.id === draggingId);
    const targetIndex = next.findIndex((t) => t.id === targetId);
    if (!dragged || targetIndex === -1) return;
    next.splice(targetIndex, 0, dragged);
    reorderTags(next);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-muted shadow-card transition duration-200 ease-smooth hover:border-accent hover:text-content active:scale-95"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        Gérer
      </button>

      {open && (
        <div className="glass absolute left-0 top-full z-30 mt-1.5 w-72 rounded-xl border border-glass-border p-2 shadow-pop animate-[pop-in_200ms_var(--ease-spring)]">
          <div className="mb-1 px-1 text-xs font-semibold text-faint">
            Gérer les étiquettes
          </div>

          <div className="max-h-72 overflow-y-auto">
            {tags.map((t) => {
              const isEditing = editingId === t.id;
              const isDragging = draggingId === t.id;
              const isDropTarget = dragOverId === t.id && !isDragging;
              return (
                <div
                  key={t.id}
                  onDragOver={(e) => {
                    if (!draggingId || draggingId === t.id) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverId(t.id);
                  }}
                  onDragLeave={() =>
                    setDragOverId((id) => (id === t.id ? null : id))
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverId(null);
                    moveTag(t.id);
                  }}
                  className={`group flex items-center gap-1 rounded px-1 py-1 ${
                    isDragging ? "opacity-40" : ""
                  } ${isDropTarget ? "border-t-2 border-accent" : "border-t-2 border-transparent"}`}
                >
                  {/* Poignée de réordonnancement */}
                  <span
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(t.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverId(null);
                    }}
                    aria-label="Réordonner"
                    title="Glisser pour réordonner"
                    className="shrink-0 cursor-grab px-0.5 text-faint transition hover:text-muted active:cursor-grabbing"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="6" r="1.6" />
                      <circle cx="15" cy="6" r="1.6" />
                      <circle cx="9" cy="12" r="1.6" />
                      <circle cx="15" cy="12" r="1.6" />
                      <circle cx="9" cy="18" r="1.6" />
                      <circle cx="15" cy="18" r="1.6" />
                    </svg>
                  </span>

                  {isEditing ? (
                    <div className="flex w-full flex-col gap-1.5">
                      <input
                        autoFocus
                        value={editName}
                        onFocus={(e) => e.target.select()}
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
                        onClick={() => startEdit(t.id, t.name)}
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm text-content"
                      >
                        <span
                          className={`h-4 w-4 shrink-0 rounded-full ${tagDotClass[t.color]}`}
                        />
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
                        onClick={() => remove(t.id, t.name)}
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

            {tags.length === 0 && (
              <p className="px-1.5 py-2 text-xs text-faint">
                Aucune étiquette pour le moment.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={createTag}
            className="mt-1 flex w-full items-center gap-1.5 rounded px-1.5 py-1.5 text-left text-sm text-accent transition hover:bg-surface-hover"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouvelle étiquette
          </button>
        </div>
      )}
    </div>
  );
}
