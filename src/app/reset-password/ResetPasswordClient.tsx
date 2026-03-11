"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/reset`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as any;
      if (!response.ok) throw new Error(data?.error || "Reset failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/70 p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">DAB AI</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Set a new password for your account.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Reset token
          <input
            value={token}
            readOnly
            className="h-11 rounded-xl border border-slate-200 bg-white/60 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-slate-500">
          New password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            placeholder="New password"
            required
            type="password"
          />
        </label>

        {status === "success" ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Password updated. You can now log in.
          </div>
        ) : null}

        {status === "error" && error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>

        <div className="text-xs text-slate-500">
          <Link className="hover:text-slate-900 dark:hover:text-slate-200" href="/login">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}

