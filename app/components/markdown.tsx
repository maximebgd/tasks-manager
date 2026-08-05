"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Rendu Markdown des notes. remark-gfm ajoute tables, listes à cocher, liens
 * automatiques, etc. react-markdown n'injecte pas d'HTML brut (sûr par défaut).
 * La mise en forme vit dans la classe `.markdown` (globals.css), pilotée par
 * les tokens du thème → jour/nuit automatique.
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown text-sm leading-relaxed text-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
