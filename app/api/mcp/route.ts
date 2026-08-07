import { createMcpHandler } from "mcp-handler";
import { registerTools } from "@/lib/mcp/tools";

// Endpoint MCP (Streamable HTTP) exposé par l'app Next. Un client LLM (Claude
// Desktop, LM Studio, Ollama…) s'y connecte pour piloter les tâches via les
// outils définis dans `lib/mcp/tools.ts`.
//
// Prisma nécessite le runtime Node ; force aussi le rendu dynamique (accès BDD).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createMcpHandler(
  (server) => {
    registerTools(server);
  },
  {
    serverInfo: { name: "tasks-manager", version: "1.0.0" },
    instructions:
      "Gestionnaire de tâches (tableau kanban + todos journalières). Utilise " +
      "list_tags avant de rattacher des étiquettes, et list_tasks / search_tasks " +
      "pour retrouver un id avant de modifier ou supprimer.",
  },
);

function unauthorized(): Response {
  return Response.json(
    { error: "unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="mcp"' } },
  );
}

// Garde d'accès : un token statique `MCP_TOKEN` (Authorization: Bearer <token>).
// Suffisant pour un usage mono-utilisateur ; l'endpoint reste inerte si le token
// n'est pas configuré, pour ne jamais exposer la base par défaut.
async function guarded(request: Request): Promise<Response> {
  const token = process.env.MCP_TOKEN;
  if (!token) {
    return Response.json(
      { error: "MCP_TOKEN n'est pas configuré côté serveur." },
      { status: 503 },
    );
  }
  const header = request.headers.get("authorization");
  if (header !== `Bearer ${token}`) return unauthorized();
  return handler(request);
}

export {
  guarded as GET,
  guarded as POST,
  guarded as DELETE,
};
