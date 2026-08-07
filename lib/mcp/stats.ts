import type { McpHandlerOptions } from "mcp-handler";

// Compteurs d'activité MCP, tenus **en mémoire** (remis à zéro à chaque
// redémarrage de l'app, et non partagés entre instances en prod). `mcp-handler`
// est stateless : il n'expose ni sessions persistantes ni connexions ouvertes,
// seulement des événements par requête via `onEvent`. On en dérive donc une vue
// d'*activité* — pas un « nombre de clients connectés » en temps réel, notion
// que ce protocole ne fournit pas.

// Le type d'événement n'est pas exporté par le package : on le récupère depuis
// la signature de `onEvent`.
type McpEvent = Parameters<NonNullable<McpHandlerOptions["onEvent"]>>[0];

export type McpStats = {
  /** Démarrage du process (base « depuis le … » des compteurs). */
  startedAt: number;
  /** Requêtes MCP menées à terme. */
  totalRequests: number;
  /** Handshakes `initialize` — au plus proche d'un « client » qui se branche. */
  sessions: number;
  /** Requêtes terminées en erreur. */
  errors: number;
  /** Dernière activité observée (ms epoch), ou `null` si aucune. */
  lastActivityAt: number | null;
  /** Nombre d'appels par outil (`tools/call`). */
  toolCalls: Record<string, number>;
};

const stats: McpStats = {
  startedAt: Date.now(),
  totalRequests: 0,
  sessions: 0,
  errors: 0,
  lastActivityAt: null,
  toolCalls: {},
};

// Branché sur `onEvent` du handler. On compte les requêtes à leur *complétion*
// (pour ne pas doubler avec `REQUEST_RECEIVED`) mais on relève le nom de l'outil
// à la *réception*, où les `parameters` sont garantis présents.
export function recordMcpEvent(event: McpEvent): void {
  stats.lastActivityAt = event.timestamp;

  if (event.type === "ERROR") {
    stats.errors += 1;
    return;
  }

  if (event.type === "REQUEST_RECEIVED") {
    if (event.method === "tools/call") {
      const name = (event.parameters as { name?: string } | undefined)?.name;
      if (name) stats.toolCalls[name] = (stats.toolCalls[name] ?? 0) + 1;
    }
    return;
  }

  // REQUEST_COMPLETED
  stats.totalRequests += 1;
  if (event.method === "initialize") stats.sessions += 1;
}

export function getMcpStats(): McpStats {
  return { ...stats, toolCalls: { ...stats.toolCalls } };
}
