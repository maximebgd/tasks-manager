"use client";

import { useState } from "react";

// Champ en lecture seule avec bouton « copier ». Utilisé pour l'URL, le token
// et le snippet de configuration sur la page MCP.
export function CopyField({
  value,
  label,
  multiline = false,
  masked = false,
}: {
  value: string;
  label?: string;
  multiline?: boolean;
  masked?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard indisponible (contexte non sécurisé) : on ignore silencieusement.
    }
  };

  const display = masked && !revealed ? "•".repeat(Math.min(value.length, 40)) : value;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-muted">{label}</span>
      )}
      <div className="flex items-stretch gap-2">
        {multiline ? (
          <pre className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-line bg-surface-muted px-3 py-2 font-mono text-xs text-content">
            {display}
          </pre>
        ) : (
          <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-surface-muted px-3 py-2 font-mono text-sm text-content">
            {display}
          </code>
        )}
        <div className="flex shrink-0 flex-col gap-1">
          {masked && (
            <button
              onClick={() => setRevealed((r) => !r)}
              className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted transition duration-200 ease-smooth hover:bg-surface-hover hover:text-content"
            >
              {revealed ? "Masquer" : "Afficher"}
            </button>
          )}
          <button
            onClick={copy}
            className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted transition duration-200 ease-smooth hover:bg-surface-hover hover:text-content"
          >
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
      </div>
    </div>
  );
}
