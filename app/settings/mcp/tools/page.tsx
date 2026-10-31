import Link from "next/link";
import { headers } from "next/headers";
import { getLocaleFromCookieHeader } from "@/lib/i18n/locale";
import { mcpText } from "@/lib/i18n/mcp";
import {
  CALL_EXAMPLE,
  MCP_TYPES,
  toolsByGroup,
  type ToolParam,
} from "@/lib/mcp/catalog";

// Référence des outils MCP, rendue depuis le catalogue typé `lib/mcp/catalog.ts`
// (source unique, partagée avec `docs/mcp-tools.md` et les descriptions des
// outils). Aucun accès disque : tout est bundlé.
export const dynamic = "force-dynamic";

function ParamsTable({ params, locale }: { params: ToolParam[]; locale: "fr" | "es" }) {
  if (params.length === 0) {
    return <p className="mt-2 text-sm text-muted">{mcpText(locale, "noParams")}</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
            <th className="py-2 pr-3 font-medium">{mcpText(locale, "parameter")}</th>
            <th className="py-2 pr-3 font-medium">{mcpText(locale, "type")}</th>
            <th className="py-2 pr-3 font-medium">{mcpText(locale, "required")}</th>
            <th className="py-2 pr-3 font-medium">{mcpText(locale, "default")}</th>
            <th className="py-2 font-medium">{mcpText(locale, "description")}</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-line/60 align-top">
              <td className="py-2 pr-3">
                <code className="font-mono text-content">{p.name}</code>
              </td>
              <td className="py-2 pr-3">
                <code className="font-mono text-xs text-muted">{p.type}</code>
              </td>
              <td className="py-2 pr-3">
                {p.required ? (
                  <span className="font-medium text-content">{mcpText(locale, "yes")}</span>
                ) : (
                  <span className="text-faint">{mcpText(locale, "no")}</span>
                )}
              </td>
              <td className="py-2 pr-3">
                {p.default ? (
                  <code className="font-mono text-xs text-muted">{p.default}</code>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </td>
              <td className="py-2 text-muted">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function McpToolsPage() {
  const h = await headers();
  const locale = getLocaleFromCookieHeader(h.get("cookie") ?? undefined);
  const groups = toolsByGroup();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/settings/mcp"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition duration-200 ease-smooth hover:text-content"
      >
        <span aria-hidden="true">←</span> {mcpText(locale, "back")}
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-content">
          {mcpText(locale, "referenceTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mcpText(locale, "referenceIntro")}{" "}{/*
          <code className="font-mono text-content">tools/call</code>, avec
          l'en-tête{" "}
          <code className="font-mono text-content">
            Authorization: Bearer &lt;MCP_TOKEN&gt;
          </code>
          . Les retours sont du texte (JSON pour les lectures/créations, message
          de confirmation sinon). Les identifiants sont générés par la base — le
          LLM ne les fournit jamais à la création.
          */}
        </p>
      </header>

      {/* Types & énumérations */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          {mcpText(locale, "types")}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-4 shadow-card">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {MCP_TYPES.map((t) => (
                <tr key={t.name} className="border-b border-line/60 align-top last:border-0">
                  <td className="w-32 py-2 pr-3">
                    <code className="font-mono text-content">{t.name}</code>
                  </td>
                  <td className="py-2 font-mono text-xs text-muted">
                    {t.def.replace(/`/g, "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Outils par groupe */}
      {groups.map(({ group, tools }) => (
        <section key={group} className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-faint">
            {group}
          </h2>
          <div className="flex flex-col gap-4">
            {tools.map((tool) => (
              <article
                key={tool.name}
                className="rounded-2xl border border-line bg-surface p-5 shadow-card"
              >
                <h3 className="font-mono text-base font-semibold text-content">
                  {tool.name}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{tool.summary}</p>
                <ParamsTable params={tool.params} locale={locale} />
                <p className="mt-3 text-sm text-muted">
                  <span className="font-medium text-content">{mcpText(locale, "returns")} </span>
                  {tool.returns.replace(/`/g, "")}
                </p>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Exemple */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          {mcpText(locale, "example")}
        </h2>
        <pre className="overflow-x-auto rounded-2xl border border-line bg-surface-muted p-4 font-mono text-xs text-content">
          {CALL_EXAMPLE}
        </pre>
        <p className="mt-3 text-sm text-muted">
          {mcpText(locale, "introspection")}
        </p>
      </section>
    </main>
  );
}
