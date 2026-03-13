"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";

export function TopNav() {
  const { user, isReady } = useAuth();

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

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {isReady ? (
            user ? (
              <Link
                href="/profile"
                className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
                aria-label="Profile"
              >
                {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
              >
                Log in
              </Link>
            )
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
