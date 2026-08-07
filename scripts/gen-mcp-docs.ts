// Génère `docs/mcp-tools.md` depuis le catalogue typé `lib/mcp/catalog.ts`.
// Lancer avec : `npm run docs:mcp`. Ne pas éditer le Markdown à la main.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CALL_EXAMPLE,
  MCP_TYPES,
  toolsByGroup,
  type ToolDoc,
} from "../lib/mcp/catalog";

// Dans une cellule de tableau Markdown, `|` doit être échappé pour ne pas
// couper la colonne (y compris à l'intérieur de backticks).
const cell = (s: string) => s.replace(/\|/g, "\\|");

function paramsTable(tool: ToolDoc): string {
  if (tool.params.length === 0) return "**Aucun paramètre.**";

  const withDefault = tool.params.some((p) => p.default);
  const header = withDefault
    ? "| Paramètre | Type | Requis | Défaut | Description |\n|---|---|---|---|---|"
    : "| Paramètre | Type | Requis | Description |\n|---|---|---|---|";

  const rows = tool.params.map((p) => {
    const req = p.required ? "**oui**" : "non";
    const type = cell(`\`${p.type}\``);
    const base = `| \`${p.name}\` | ${type} | ${req} |`;
    return withDefault
      ? `${base} ${p.default ? `\`${p.default}\`` : "—"} | ${cell(p.description)} |`
      : `${base} ${cell(p.description)} |`;
  });

  return [header, ...rows].join("\n");
}

function build(): string {
  const out: string[] = [];

  out.push(`<!-- Généré par \`npm run docs:mcp\` depuis lib/mcp/catalog.ts — ne pas éditer à la main. -->

# Référence des outils MCP

Documentation des outils exposés par le serveur MCP (\`app/api/mcp\`). Chaque outil
est appelé via la méthode JSON-RPC \`tools/call\` :

\`\`\`json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "<nom_outil>", "arguments": { /* … */ } }
}
\`\`\`

Toutes les requêtes exigent l'en-tête \`Authorization: Bearer <MCP_TOKEN>\`. Les
outils renvoient leur résultat sous forme de **texte** (\`content[].text\`) :
JSON sérialisé pour les lectures/créations, message de confirmation pour les
actions sans valeur de retour.

> **Périmètre** : lecture + écriture complète. Les identifiants (\`id\`) sont
> générés par la base — le LLM ne les fournit **jamais** à la création.`);

  // Types & énumérations
  out.push(`## Types & énumérations

| Type | Valeurs / champs |
|---|---|
${MCP_TYPES.map((t) => `| \`${t.name}\` | ${cell(t.def)} |`).join("\n")}

Conventions : \`null\` signifie « aucune valeur / actif » ; \`deletedAt\` non nul =
élément à la corbeille (soft delete).`);

  // Outils par groupe
  for (const { group, tools } of toolsByGroup()) {
    out.push(`---\n\n## ${group}`);
    for (const tool of tools) {
      out.push(
        `### \`${tool.name}\`\n${tool.summary}\n\n${paramsTable(tool)}\n\n**Retour** : ${tool.returns}`,
      );
    }
  }

  // Exemple
  out.push(`---

## Exemple complet

\`\`\`json
${CALL_EXAMPLE}
\`\`\`

> La liste des outils est aussi introspectable à chaud via la méthode
> \`tools/list\` (noms, descriptions et schémas d'entrée JSON Schema).`);

  return out.join("\n\n") + "\n";
}

async function main() {
  const target = path.join(process.cwd(), "docs", "mcp-tools.md");
  await writeFile(target, build(), "utf8");
  console.log(`✓ ${path.relative(process.cwd(), target)} généré depuis le catalogue.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
