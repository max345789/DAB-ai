"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { getClientApiBase } from "@/lib/clientApiBase";

const API_BASE = getClientApiBase();

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
      router.push("/chat");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
            D
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              DAB AI
            </div>
            <div className="text-xs text-zinc-500">Sign in to continue</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
              placeholder="you@company.com"
              required
              type="email"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
              placeholder="Your password"
              required
              type="password"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <Link className="hover:text-zinc-900 dark:hover:text-zinc-200" href="/forgot-password">
              Forgot password?
            </Link>
            <Link className="hover:text-zinc-900 dark:hover:text-zinc-200" href="/signup">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
