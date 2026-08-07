import { headers } from "next/headers";
import Link from "next/link";
import { CopyField } from "./copy-field";

// Page de configuration du serveur MCP. Affiche l'URL de l'endpoint, le token
// (lu côté serveur) et un snippet prêt à coller pour brancher un client LLM.
// Pas de chat : l'utilisateur apporte son propre client MCP.
export const dynamic = "force-dynamic";

export default async function McpSettingsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const endpoint = `${proto}://${host}/api/mcp`;

  const token = process.env.MCP_TOKEN ?? "";
  const configured = token.length > 0;
  const tokenForSnippet = configured ? token : "<TON_TOKEN>";

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

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-content">Serveur MCP</h1>
        <p className="mt-2 text-sm text-muted">
          Connecte ton propre LLM (Claude Desktop, LM Studio, Ollama…) à cette
          application via le protocole MCP. Le modèle pourra alors lire et
          modifier tes tâches, étiquettes et todos journalières.
        </p>
      </header>

      {!configured && (
        <div className="mb-8 rounded-2xl border border-line bg-surface-muted p-4">
          <p className="text-sm font-medium text-content">
            ⚠️ Aucun token configuré
          </p>
          <p className="mt-1 text-sm text-muted">
            L'endpoint est inactif tant que la variable{" "}
            <code className="font-mono text-content">MCP_TOKEN</code> n'est pas
            définie. Ajoute une ligne dans ton fichier{" "}
            <code className="font-mono text-content">.env</code> puis redémarre
            le serveur :
          </p>
          <div className="mt-3">
            <CopyField value='MCP_TOKEN="genere-un-secret-long-et-aleatoire"' multiline />
          </div>
        </div>
      )}

      <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 shadow-card">
        <CopyField label="URL de l'endpoint" value={endpoint} />
        {configured && (
          <CopyField label="Token d'accès (Bearer)" value={token} masked />
        )}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted">
            Configuration Claude Desktop / LM Studio
          </span>
          <p className="text-sm text-muted">
            Colle ceci dans le fichier de config de ton client (ex.{" "}
            <code className="font-mono text-content">claude_desktop_config.json</code>).
            Le pont <code className="font-mono text-content">mcp-remote</code>{" "}
            relaie le transport HTTP + l'en-tête d'authentification.
          </p>
          <CopyField value={claudeSnippet} multiline />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-content">Outils exposés</h2>
        <p className="mt-2 text-sm text-muted">
          Tâches (lister, rechercher, créer, modifier, corbeille, restaurer,
          purger), étiquettes (CRUD) et todos journalières (créer, cocher,
          sous-tâches, corbeille). Périmètre : lecture + écriture complète.
        </p>
        <Link
          href="/settings/mcp/tools"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-content transition duration-200 ease-smooth hover:bg-surface-hover"
        >
          Référence des outils
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
