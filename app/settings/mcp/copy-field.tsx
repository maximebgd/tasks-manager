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

  const iconBtn =
    "rounded-lg p-1.5 text-muted transition duration-200 ease-smooth hover:bg-surface-hover hover:text-content";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-muted">{label}</span>
      )}
      <div className="relative min-w-0">
        {multiline ? (
          <pre className={`overflow-x-auto rounded-xl border border-line bg-surface-muted py-2 pl-3 ${masked ? "pr-20" : "pr-11"} font-mono text-xs text-content`}>
            {display}
          </pre>
        ) : (
          <code className={`block truncate rounded-xl border border-line bg-surface-muted py-2 pl-3 ${masked ? "pr-20" : "pr-11"} font-mono text-sm text-content`}>
            {display}
          </code>
        )}
        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
          {masked && (
            <button
              onClick={() => setRevealed((r) => !r)}
              title={revealed ? "Masquer" : "Afficher"}
              aria-label={revealed ? "Masquer" : "Afficher"}
              className={iconBtn}
            >
              {revealed ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.39-1.61M2 2l20 20" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={copy}
            title={copied ? "Copié" : "Copier"}
            aria-label={copied ? "Copié" : "Copier"}
            className={iconBtn}
          >
            {copied ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Bouton « copier » autonome pour un contenu long qu'on ne veut pas afficher
// en entier (ex. le prompt de connexion destiné à un agent). Le texte copié
// n'est pas rendu à l'écran, seul le libellé du bouton l'est.
export function CopyPromptButton({
  value,
  label = "Pour agent",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard indisponible (contexte non sécurisé) : on ignore silencieusement.
    }
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 self-start rounded-xl border border-line px-3 py-2 text-sm font-medium text-content transition duration-200 ease-smooth hover:bg-surface-hover"
    >
      {copied ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {copied ? "Copié !" : label}
      {!copied && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <path d="M12 8V4" />
          <circle cx="12" cy="3" r="1" />
          <path d="M9 13h.01M15 13h.01" />
          <path d="M2 14v2M22 14v2" />
        </svg>
      )}
    </button>
  );
}
