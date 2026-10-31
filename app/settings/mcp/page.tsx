import { headers } from "next/headers";
import { getLocaleFromCookieHeader } from "@/lib/i18n/locale";
import { mcpText } from "@/lib/i18n/mcp";
import Link from "next/link";
import { CopyField, CopyPromptButton } from "./copy-field";
import { McpStatus } from "./status";

// Page de configuration du serveur MCP. Affiche l'URL de l'endpoint, le token
// (lu côté serveur) et un snippet prêt à coller pour brancher un client LLM.
// Pas de chat : l'utilisateur apporte son propre client MCP.
export const dynamic = "force-dynamic";

export default async function McpSettingsPage() {
  const h = await headers();
  const locale = getLocaleFromCookieHeader(h.get("cookie") ?? undefined);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const endpoint = `${proto}://${host}/api/mcp`;

  const token = process.env.MCP_TOKEN ?? "";
  const configured = token.length > 0;
  const tokenForSnippet = configured ? token : mcpText(locale, "tokenPlaceholder");

  const claudeSnippet = JSON.stringify(
    {
      mcpServers: {
        "tasks-manager": {
          command: "npx",
          args: [
            "mcp-remote",
            endpoint,
            "--header",
            `Authorization: Bearer ${tokenForSnippet}`,
          ],
        },
      },
    },
    null,
    2,
  );

  // Prompt clé-en-main à coller dans un agent (Claude Code, Codex…) pour qu'il
  // se branche seul au serveur MCP à partir de l'URL et du token.
  const agentPrompt = mcpText(locale, "promptBody", { endpoint, token: tokenForSnippet });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-content">{mcpText(locale, "title")}</h1>
        <p className="mt-2 text-sm text-muted">
          {mcpText(locale, "intro")}
        </p>
      </header>

      <McpStatus />

      {!configured && (
        <div className="mb-8 rounded-2xl border border-line bg-surface-muted p-4">
          <p className="text-sm font-medium text-content">
            ⚠️ {mcpText(locale, "noToken")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {mcpText(locale, "tokenHelp")}
          </p>
          <div className="mt-3">
            <CopyField value={`MCP_TOKEN="${locale === "fr" ? "generez-un-secret-long-et-aleatoire" : "genera-un-secreto-largo-y-aleatorio"}"`} multiline />
          </div>
        </div>
      )}

      <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 shadow-card">
        <CopyField label={mcpText(locale, "endpoint")} value={endpoint} />
        {configured && (
          <CopyField label={mcpText(locale, "accessToken")} value={token} masked />
        )}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted">
            {mcpText(locale, "clientConfig")}
          </span>
          <p className="text-sm text-muted">
            {mcpText(locale, "configHelp")}
          </p>
          <CopyField value={claudeSnippet} multiline />
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-6">
          <span className="text-xs font-medium text-muted">
            {mcpText(locale, "autoConnect")}
          </span>
          <p className="text-sm text-muted">
            {mcpText(locale, "promptHelp")}
            {!configured && (
              <>
                {" "}
                <span className="text-content">
                  {mcpText(locale, "defineToken")}
                </span>
              </>
            )}
          </p>
          <CopyPromptButton value={agentPrompt} label={mcpText(locale, "agent")} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-content">{mcpText(locale, "exposedTools")}</h2>
        <p className="mt-2 text-sm text-muted">
          {mcpText(locale, "toolsSummary")}
        </p>
        <Link
          href="/settings/mcp/tools"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-content transition duration-200 ease-smooth hover:bg-surface-hover"
        >
          {mcpText(locale, "toolReference")}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
