"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const primaryTabs = [
  { label: "Chat", href: "/chat" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/60 bg-zinc-50/80 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/70">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
            D
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            DAB AI
          </span>
        </Link>

        <nav className="flex items-center rounded-full border border-zinc-200 bg-white/60 p-1 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          {primaryTabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={[
                  "rounded-full px-3 py-1.5 transition",
                  active
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
