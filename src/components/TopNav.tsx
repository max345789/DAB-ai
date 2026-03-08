"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Chat Agent", href: "/chat" },
  { label: "Leads", href: "/leads" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Automation", href: "/automation" },
  { label: "Finance", href: "/finance" },
  { label: "Integrations", href: "/integrations" },
  { label: "Command Center", href: "/command-center" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/70 backdrop-blur-xl dark:bg-[#0b0f14]/70">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-emerald-400 text-sm font-bold text-slate-950">
            D
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              DAB AI
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Marketing OS
            </p>
          </div>
        </div>

        <nav className="hidden flex-1 justify-center gap-6 text-sm text-slate-600 dark:text-slate-300 xl:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${
                  isActive
                    ? "text-slate-900 dark:text-white"
                    : "hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/60 px-3 py-2 text-xs text-slate-600 shadow-sm dark:bg-white/5 dark:text-slate-300 md:flex">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              placeholder="Search..."
              className="w-32 bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/60 text-slate-600 shadow-sm transition hover:bg-white/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            type="button"
            aria-label="Notifications"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className="h-10 w-10 rounded-full border border-white/10 bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-500" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
