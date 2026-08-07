"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { SyncIndicator } from "./sync-indicator";

const icon = (paths: ReactNode) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths}
  </svg>
);

const links = [
  {
    href: "/",
    label: "Tableau",
    icon: icon(
      <>
        <rect x="3" y="3" width="7" height="18" rx="1.5" />
        <rect x="14" y="3" width="7" height="11" rx="1.5" />
      </>,
    ),
  },
  {
    href: "/daily",
    label: "Journalier",
    icon: icon(
      <>
        <path d="M3.5 6h17M6 3.5v2.5M18 3.5v2.5" />
        <rect x="3.5" y="6" width="17" height="14.5" rx="2" />
        <path d="M8 13l2.5 2.5L16 10" />
      </>,
    ),
  },
  {
    href: "/calendar",
    label: "Calendrier",
    icon: icon(
      <>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
        <path d="M3.5 9h17M8 3v3M16 3v3" />
      </>,
    ),
  },
  {
    href: "/trash",
    label: "Corbeille",
    icon: icon(
      <>
        <path d="M4 7h16M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1z" />
        <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" />
      </>,
    ),
  },
  {
    href: "/settings/mcp",
    label: "MCP",
    icon: icon(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
      </>,
    ),
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="glass sticky top-0 z-20 flex h-screen w-16 flex-col border-r border-line px-3 py-4 lg:w-56">
      <Link
        href="/"
        className="mb-4 flex items-center gap-2 px-1 text-sm font-semibold text-content transition duration-200 ease-smooth hover:opacity-80"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-content text-page shadow-card">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4 4 10-10" />
          </svg>
        </span>
        <span className="hidden lg:inline">Tasks</span>
      </Link>
      <div className="flex flex-col gap-1">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition duration-200 ease-smooth ${
                active
                  ? "bg-surface text-content shadow-card"
                  : "text-muted hover:bg-surface-hover hover:text-content"
              }`}
            >
              <span className="shrink-0">{l.icon}</span>
              <span className="hidden lg:inline">{l.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-auto flex items-center justify-center gap-2 border-t border-line pt-3 lg:justify-between lg:px-1">
        <ThemeToggle />
        <SyncIndicator />
      </div>
    </nav>
  );
}
