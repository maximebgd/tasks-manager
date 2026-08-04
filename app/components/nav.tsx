"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/", label: "Tableau" },
  { href: "/daily", label: "Journalier" },
  { href: "/calendar", label: "Calendrier" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-page/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2 sm:px-6 lg:px-8">
        <span className="mr-3 flex items-center gap-2 text-sm font-semibold text-content">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-content text-xs font-bold text-page">
            T
          </span>
          Tasks
        </span>
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-surface-hover text-content"
                  : "text-muted hover:bg-surface-hover hover:text-content"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
