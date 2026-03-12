"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getClientApiBase } from "@/lib/clientApiBase";

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
      const apiBase = getClientApiBase();
      if (!apiBase) throw new Error("API base URL is not configured");

      const response = await fetch(`${apiBase}/auth/reset`, {
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
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Choose a new password
        </div>
        <div className="mt-1 text-xs text-zinc-500">Set a new password for your account.</div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          Reset token
          <input
            value={token}
            readOnly
            className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          New password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
            placeholder="New password"
            required
            type="password"
          />
        </label>

        {status === "success" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
            Password updated. You can now log in.
          </div>
        ) : null}

        {status === "error" && error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>

        <div className="text-xs text-zinc-500">
          <Link className="hover:text-zinc-900 dark:hover:text-zinc-200" href="/login">
            Back to login
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}
