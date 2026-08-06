"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

/**
 * Rendu Markdown des notes. remark-gfm ajoute tables, listes à cocher, liens
 * automatiques, etc.
 *
 * Souligné : `__texte__` est détourné en `<u>texte</u>`. En Markdown standard
 * ce délimiteur veut dire « gras », mais on le réserve ici au soulignement
 * (le gras se fait via `**`). Le HTML brut correspondant est réactivé
 * (rehype-raw) puis filtré par rehype-sanitize : seul un jeu de balises sûr
 * passe, donc pas d'injection possible même via des notes synchronisées.
 */
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
};

// Sentinelle (caractère de contrôle) improbable dans des notes → pas de collision.
const SLOT = String.fromCharCode(0);

/**
 * Convertit `__texte__` en `<u>texte</u>`, en épargnant les portions de code
 * (blocs ``` et code inline `) pour ne pas toucher au contenu littéral.
 */
function underlineFromUnderscores(md: string): string {
  const codeSlots: string[] = [];
  const masked = md.replace(/```[\s\S]*?```|`[^`\n]*`/g, (match) => {
    codeSlots.push(match);
    return `${SLOT}${codeSlots.length - 1}${SLOT}`;
  });
  const converted = masked.replace(/__(?=\S)([\s\S]*?\S)__/g, "<u>$1</u>");
  return converted.replace(
    new RegExp(`${SLOT}(\\d+)${SLOT}`, "g"),
    (_, i) => codeSlots[Number(i)],
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown text-sm leading-relaxed text-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
      >
        {underlineFromUnderscores(content)}
      </ReactMarkdown>
    </div>
  );
}
