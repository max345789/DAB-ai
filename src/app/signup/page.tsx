"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(data?.error || "Sign up failed");
      }
      login(data.token, data.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/70 p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">DAB AI</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Start with a small budget, then scale as your campaigns perform.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Full name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            placeholder="Sarath"
            required
          />
        </label>
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
            placeholder="Create a password"
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
          {isSubmitting ? "Creating..." : "Create account"}
        </Button>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link className="hover:text-slate-900 dark:hover:text-slate-200" href="/login">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

