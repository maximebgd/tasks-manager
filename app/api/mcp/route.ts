import { createHash, timingSafeEqual } from "node:crypto";
import { createMcpHandler } from "mcp-handler";
import { registerTools } from "@/lib/mcp/tools";
import { recordMcpEvent } from "@/lib/mcp/stats";

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
    // Alimente les compteurs d'activité affichés sur /settings/mcp.
    onEvent: recordMcpEvent,
  },
);

function unauthorized(): Response {
  return Response.json(
    { error: "unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="mcp"' } },
  );
}

// Comparaison à temps constant du header `Authorization` avec le token attendu.
// `timingSafeEqual` exige des buffers de même longueur (et lève sinon), donc on
// hache les deux côtés en SHA-256 : longueur fixe, et la longueur du token
// n'influe pas sur le temps de comparaison.
function tokenMatches(header: string | null, token: string): boolean {
  if (header === null) return false;
  const expected = createHash("sha256").update(`Bearer ${token}`).digest();
  const received = createHash("sha256").update(header).digest();
  return timingSafeEqual(expected, received);
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
  if (!tokenMatches(header, token)) return unauthorized();
  return handler(request);
}

export {
  guarded as GET,
  guarded as POST,
  guarded as DELETE,
};
