"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

type MeResponse = {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string | null;
};

export default function ProfilePage() {
  const { token, user, isReady, refreshMe } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const displayName = useMemo(() => me?.name || user?.name || "User", [me, user]);
  const avatarUrl = useMemo(() => me?.avatar_url || user?.avatarUrl || null, [me, user]);

  useEffect(() => {
    async function load() {
      if (!token) return;
      setError(null);
      const response = await fetch(`${API_BASE}/auth/me`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError("Unable to load profile. Please log in again.");
        return;
      }
      const data = (await response.json()) as any;
      setMe({
        id: Number(data.id),
        name: String(data.name ?? ""),
        email: String(data.email ?? ""),
        role: data.role != null ? String(data.role) : undefined,
        avatar_url: data.avatar_url != null ? String(data.avatar_url) : null,
      });
    }

    if (isReady) load().catch((e) => setError(e?.message || "Profile load failed"));
  }, [isReady, token]);

  async function handleAvatarUpload(file: File) {
    if (!token) return;
    setIsUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("avatar", file);

      const response = await fetch(`${API_BASE}/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(data?.error || "Avatar upload failed");
      }

      await refreshMe();
      setMe((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/70 p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You are not signed in.
        </p>
        <div className="mt-4">
          <Link href="/login">
            <Button type="button">Go to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Account</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Profile
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage your details and avatar.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="rounded-3xl border border-white/10 bg-white/70 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Avatar</p>
          <div className="mt-6 flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-500">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">{me?.email || user?.email}</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="flex flex-col gap-2 text-xs text-slate-500">
              Upload photo
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800 dark:file:bg-white dark:file:text-slate-900 dark:hover:file:bg-slate-100"
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              Recommended: square image, under 2MB.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/70 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Details</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500">Name</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {me?.name || user?.name}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500">Email</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {me?.email || user?.email}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500">Role</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {me?.role || user?.role || "user"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500">User ID</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {me?.id ?? user?.id}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
