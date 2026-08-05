"use client";

import { useState } from "react";
import type { Priority, Task } from "@/lib/types";
import { PRIORITIES } from "@/lib/types";
import { TagPicker } from "./tag-picker";

export function AddTaskForm({
  onAdd,
  onClose,
}: {
  onAdd: (task: Task) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    onAdd({
      id: crypto.randomUUID(),
      title: trimmed,
      description: description.trim() || undefined,
      status: "todo",
      priority,
      dueDate: dueDate || null,
      tagIds,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    onClose();
  }

  const field =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content shadow-card outline-none transition duration-200 ease-smooth placeholder:text-faint hover:border-line-strong focus:border-accent focus:ring-2 focus:ring-accent-soft";

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-line bg-surface-muted p-4 shadow-card"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">
            Titre
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Préparer la démo"
            className={field}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optionnel"
            className={field}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Priorité
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={field}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Échéance
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={field}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">
            Tags
          </label>
          <TagPicker selectedIds={tagIds} onChange={setTagIds} />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm font-medium text-muted transition duration-200 ease-smooth hover:bg-surface-hover hover:text-content active:scale-95"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-card transition duration-200 ease-spring hover:shadow-lift hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Ajouter la tâche
        </button>
      </div>
    </form>
  );
}
