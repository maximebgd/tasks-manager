"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/task-ui";
import { mcpText } from "@/lib/i18n/mcp";

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

const PHASE_KEYS: Record<Phase, "checking" | "online" | "inactive" | "unreachable"> = { checking: "checking", ok: "online", off: "inactive", error: "unreachable" };
function relative(ts: number | null, locale: "fr" | "es"): string {
  if (!ts) return mcpText(locale, "noActivity");
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return mcpText(locale, "statusAgoSeconds", { count: s });
  const m = Math.round(s / 60);
  if (m < 60) return mcpText(locale, "statusAgoMinutes", { count: m });
  const h = Math.round(m / 60);
  if (h < 24) return mcpText(locale, "statusAgoHours", { count: h });
  return mcpText(locale, "statusAgoDays", { count: Math.round(h / 24) });
}

export function McpStatus() {
  const locale = useLocale();
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

  const label = mcpText(locale, PHASE_KEYS[phase]);
  const tools = stats
    ? Object.entries(stats.toolCalls).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${phase === "checking" ? "led led-orange animate-pulse" : phase === "ok" ? "led led-green" : "led led-red"}`}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-content">{label}</span>
        </div>
        <button
          onClick={() => check()}
          disabled={phase === "checking"}
          className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-content transition duration-200 ease-smooth hover:bg-surface-hover disabled:opacity-50"
        >
          {mcpText(locale, "retest")}
        </button>
      </div>

      {phase === "ok" && stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label={mcpText(locale, "sessions")} value={stats.sessions} />
            <Stat label={mcpText(locale, "requests")} value={stats.totalRequests} />
            <Stat label={mcpText(locale, "lastActivity")} value={relative(stats.lastActivityAt, locale)} />
          </div>

          {tools.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                {mcpText(locale, "callsByTool")}
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
            {mcpText(locale, "counters")}
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
