"use client";

import { useCallback, useEffect, useState } from "react";

// Diode d'état + panneau d'activité du serveur MCP. Interroge /api/mcp/health
// au montage, en re-test manuel et via un léger rafraîchissement périodique.
// « clients connectés en temps réel » n'existe pas côté MCP (transport HTTP
// stateless) : on affiche donc une vue d'activité (sessions, requêtes, outils).

type McpStats = {
  startedAt: number;
  totalRequests: number;
  sessions: number;
  errors: number;
  lastActivityAt: number | null;
  toolCalls: Record<string, number>;
};

type Health = { ok: boolean; tokenConfigured: boolean; stats: McpStats };

type Phase = "checking" | "ok" | "off" | "error";

const META: Record<Phase, { dot: string; label: string; pulse: boolean }> = {
  checking: { dot: "led led-orange", label: "Vérification…", pulse: true },
  ok: { dot: "led led-green", label: "En ligne", pulse: false },
  off: { dot: "led led-red", label: "Inactif — aucun token configuré", pulse: false },
  error: { dot: "led led-red", label: "Injoignable", pulse: false },
};

function relative(ts: number | null): string {
  if (!ts) return "aucune";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `il y a ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function McpStatus() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [stats, setStats] = useState<McpStats | null>(null);

  const check = useCallback(async (silent = false) => {
    if (!silent) setPhase("checking");
    try {
      const res = await fetch("/api/mcp/health", { cache: "no-store" });
      if (!res.ok) {
        setPhase("error");
        return;
      }
      const data: Health = await res.json();
      setStats(data.stats);
      setPhase(data.tokenConfigured ? "ok" : "off");
    } catch {
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(() => check(true), 15000);
    return () => clearInterval(id);
  }, [check]);

  const meta = META[phase];
  const tools = stats
    ? Object.entries(stats.toolCalls).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot} ${meta.pulse ? "animate-pulse" : ""}`}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-content">{meta.label}</span>
        </div>
        <button
          onClick={() => check()}
          disabled={phase === "checking"}
          className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-content transition duration-200 ease-smooth hover:bg-surface-hover disabled:opacity-50"
        >
          Re-tester
        </button>
      </div>

      {phase === "ok" && stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Sessions" value={stats.sessions} />
            <Stat label="Requêtes" value={stats.totalRequests} />
            <Stat label="Dernière activité" value={relative(stats.lastActivityAt)} />
          </div>

          {tools.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Appels par outil
              </span>
              <ul className="flex flex-col gap-1">
                {tools.map(([name, n]) => (
                  <li
                    key={name}
                    className="flex items-center justify-between text-sm"
                  >
                    <code className="font-mono text-content">{name}</code>
                    <span className="tabular-nums text-muted">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-faint">
            Compteurs en mémoire depuis le démarrage de l'app (remis à zéro au
            redémarrage). Le protocole MCP ne fournit pas de nombre de clients
            connectés en temps réel — ceci reflète l'activité observée.
          </p>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-surface-muted px-3 py-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="tabular-nums text-sm font-semibold text-content">
        {value}
      </span>
    </div>
  );
}
