"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/", label: "Tableau" },
  { href: "/daily", label: "Journalier" },
  { href: "/calendar", label: "Calendrier" },
  { href: "/trash", label: "Corbeille" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="glass sticky top-0 z-20 border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2.5 sm:px-6 lg:px-8">
        <span className="mr-3 flex items-center gap-2 text-sm font-semibold text-content">
          <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-content text-xs font-bold text-page shadow-card">
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
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition duration-200 ease-smooth ${
                active
                  ? "bg-surface text-content shadow-card"
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
