import { getMcpStats } from "@/lib/mcp/stats";

// Sonde de santé du serveur MCP, consommée par le composant client de
// /settings/mcp (diode d'état + panneau d'activité). Non authentifiée : elle ne
// révèle que le fait qu'un token soit configuré et des compteurs agrégés — rien
// de la base. `MCP_TOKEN` absent → l'endpoint MCP est inerte (503), reflété ici
// par `tokenConfigured: false`.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json({
    ok: true,
    tokenConfigured: Boolean(process.env.MCP_TOKEN),
    stats: getMcpStats(),
  });
}
