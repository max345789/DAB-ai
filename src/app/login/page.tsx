"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(data?.error || "Login failed");
      }
      login(data.token, data.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/70 p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">DAB AI</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to manage campaigns, leads, automations, and reports.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-xs text-slate-500">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
              placeholder="you@company.com"
              required
              type="email"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-slate-500">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
              placeholder="Your password"
              required
              type="password"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <Link className="hover:text-slate-900 dark:hover:text-slate-200" href="/forgot-password">
              Forgot password?
            </Link>
            <Link className="hover:text-slate-900 dark:hover:text-slate-200" href="/signup">
              Create account
            </Link>
          </div>
        </form>
      </div>

      <div className="hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 p-10 shadow-sm dark:border-slate-800 lg:block">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          What you can do after login
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <li>Launch campaigns and generate ad variants.</li>
          <li>Capture leads and run automated follow-ups.</li>
          <li>Track spend, revenue, and ROAS with live metrics.</li>
          <li>Monitor agent activity and automation history.</li>
        </ul>
      </div>
    </div>
  );
}

