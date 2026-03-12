"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { getClientApiBase } from "@/lib/clientApiBase";

type Profile = {
  id: number;
  name: string | null;
  email: string;
  role?: string | null;
  createdat?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  dob?: string | null;
  country?: string | null;
  bio?: string | null;
};

type Integration = {
  id: number;
  service_name: string | null;
  platform?: string | null;
  display_name?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  has_credentials?: boolean | null;
  connected_at?: string | null;
};

type SettingsSection =
  | "account"
  | "integrations"
  | "password"
  | "notifications"
  | "personalization"
  | "security"
  | "help";

function Icon({ name }: { name: "camera" | "search" | "bell" | "mail" | "phone" | "calendar" | "user" }) {
  if (name === "camera") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }
  if (name === "mail") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z" />
        <path d="m22 6-10 7L2 6" />
      </svg>
    );
  }
  if (name === "phone") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.58a2 2 0 0 1 2.11-.45c.8.25 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function splitName(full: string) {
  const trimmed = (full || "").trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function composeName(first: string, last: string) {
  return [first.trim(), last.trim()].filter(Boolean).join(" ").trim();
}

function IntegrationConnectModal(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  platform: string;
  connectUrl?: string;
  onConnect: (credentials: Record<string, unknown>) => Promise<void>;
}) {
  const { open, onClose, title, platform, connectUrl, onConnect } = props;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [extra, setExtra] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8 backdrop-blur-sm dark:bg-black/55">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold tracking-tight">{title}</div>
            <div className="mt-1 text-sm text-zinc-500">
              Connect {platform} to DAB AI. You can use the popup login or paste credentials.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
          >
            Close
          </button>
        </div>

        {connectUrl ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200">
            <div className="font-medium">Popup login</div>
            <div className="mt-1 text-xs text-zinc-500">This opens a separate window for authentication.</div>
            <div className="mt-3">
              <Button
                type="button"
                className="rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={() => {
                  const w = 560;
                  const h = 720;
                  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
                  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
                  window.open(connectUrl, `${platform}-connect`, `width=${w},height=${h},left=${left},top=${top}`);
                }}
              >
                Continue to {platform}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="text-sm font-semibold">Credentials (optional)</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-600 dark:text-zinc-300">
              Access token / key
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
                placeholder="Paste token…"
              />
            </label>
            <label className="text-xs text-zinc-600 dark:text-zinc-300">
              Extra (id / account)
              <input
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
                placeholder="Optional…"
              />
            </label>
          </div>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
              {error}
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              className="rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              onClick={async () => {
                setIsSaving(true);
                setError(null);
                try {
                  await onConnect({
                    token: token || undefined,
                    extra: extra || undefined,
                  });
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Connect failed");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? "Saving..." : "Save connection"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { token, user, isReady, logout } = useAuth();
  const [section, setSection] = useState<SettingsSection>("account");
  const [me, setMe] = useState<Profile | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [connectTarget, setConnectTarget] = useState<null | { platform: string; title: string; url?: string }>(null);

  const displayName = useMemo(() => me?.name || user?.name || "User", [me, user]);
  const avatarUrl = useMemo(() => me?.avatar_url || user?.avatarUrl || null, [me, user]);

  const { first: initialFirst, last: initialLast } = useMemo(
    () => splitName(me?.name || user?.name || ""),
    [me?.name, user?.name]
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");

  function requireApiBase() {
    const apiBase = getClientApiBase();
    if (!apiBase) throw new Error("API base URL is not configured");
    return apiBase;
  }

  useEffect(() => {
    setFirstName(initialFirst);
    setLastName(initialLast);
  }, [initialFirst, initialLast]);

  useEffect(() => {
    if (!me) return;
    setEmail(me.email || "");
    setPhone(me.phone || "");
    setDob(me.dob || "");
    setCountry(me.country || "");
    setBio(me.bio || "");
  }, [me]);

  async function loadProfile() {
    if (!token) return;
    setError(null);
    const apiBase = requireApiBase();
    const response = await fetch(`${apiBase}/profile`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Unable to load profile");
    setMe(data);
  }

  async function loadIntegrations() {
    if (!token) return;
    const apiBase = requireApiBase();
    const response = await fetch(`${apiBase}/integrations`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Unable to load integrations");
    setIntegrations(Array.isArray(data.integrations) ? data.integrations : []);
  }

  useEffect(() => {
    if (!isReady || !token) return;
    loadProfile().catch((e) => setError(e?.message || "Profile load failed"));
    loadIntegrations().catch(() => {});
  }, [isReady, token]);

  async function handleAvatarUpload(file: File) {
    if (!token) return;
    setIsUploading(true);
    setError(null);

    try {
      const apiBase = requireApiBase();
      const form = new FormData();
      form.append("avatar", file);

      const response = await fetch(`${apiBase}/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Avatar upload failed");
      await loadProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveAccount() {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      const apiBase = requireApiBase();
      const response = await fetch(`${apiBase}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: composeName(firstName, lastName),
          phone,
          dob: dob || null,
          country,
          bio,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Save failed");
      setMe(data.profile);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function connectIntegration(platform: string, credentials: Record<string, unknown>) {
    if (!token) throw new Error("Not signed in");
    const apiBase = requireApiBase();
    const response = await fetch(`${apiBase}/integration/connect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        platform,
        credentials,
        display_name: platform,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Connect failed");
    await loadIntegrations();
  }

  async function disconnectIntegration(platform: string) {
    if (!token) throw new Error("Not signed in");
    const apiBase = requireApiBase();
    const response = await fetch(`${apiBase}/integration/disconnect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ platform }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Disconnect failed");
    await loadIntegrations();
  }

  const sections: Array<{ key: SettingsSection; label: string }> = [
    { key: "account", label: "Account Information" },
    { key: "integrations", label: "Integrations" },
    { key: "password", label: "Change Password" },
    { key: "notifications", label: "Notification" },
    { key: "personalization", label: "Personalization" },
    { key: "security", label: "Security & Privacy" },
    { key: "help", label: "Help" },
  ];

  const integrationCards = [
    {
      platform: "whatsapp",
      title: "WhatsApp",
      url: process.env.NEXT_PUBLIC_WHATSAPP_CONNECT_URL,
      hint: "Connect WhatsApp Cloud API to send follow-ups and receive messages.",
    },
    {
      platform: "meta",
      title: "Meta Ads",
      url: process.env.NEXT_PUBLIC_META_CONNECT_URL,
      hint: "Sync ad performance and leads from Meta.",
    },
    {
      platform: "google",
      title: "Google Ads",
      url: process.env.NEXT_PUBLIC_GOOGLE_CONNECT_URL,
      hint: "Sync Google Ads campaigns and conversion events.",
    },
    {
      platform: "email",
      title: "Email",
      url: process.env.NEXT_PUBLIC_EMAIL_CONNECT_URL,
      hint: "Configure SMTP for automated follow-up email.",
    },
    {
      platform: "calendar",
      title: "Calendar",
      url: process.env.NEXT_PUBLIC_CALENDAR_CONNECT_URL,
      hint: "Connect calendar to schedule meetings.",
    },
  ];

  const integrationState = useMemo(() => {
    const map = new Map<string, Integration>();
    for (const row of integrations) {
      const key = (row.service_name || row.platform || "").toLowerCase();
      if (key) map.set(key, row);
    }
    return map;
  }, [integrations]);

  if (!token) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="text-sm text-zinc-600 dark:text-zinc-300">You are not signed in.</div>
        <div className="mt-4">
          <Link href="/login">
            <Button type="button" className="rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Go to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
            <Icon name="user" />
          </div>
          <div>
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-xs text-zinc-500">{me?.email || user?.email}</div>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 sm:justify-center">
          <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
            <span className="text-zinc-400">
              <Icon name="search" />
            </span>
            <input
              placeholder="Search"
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
            aria-label="Notifications"
          >
            <Icon name="bell" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="px-2 pb-3 text-sm font-semibold">Settings</div>
          <div className="space-y-1">
            {sections.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className={[
                  "w-full rounded-2xl px-3 py-2 text-left text-sm transition",
                  section === item.key
                    ? "bg-blue-600 text-white"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-950/40",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-2xl px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-950/40"
            >
              Log out
            </button>
          </div>
        </aside>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          {section === "account" ? (
            <>
              <div className="text-2xl font-semibold tracking-tight">Account Information</div>
              <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : null}
                      <label className="absolute bottom-1 right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/75 text-white shadow-md">
                        <Icon name="camera" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAvatarUpload(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={isSaving}
                        className="rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        onClick={saveAccount}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-zinc-500">
                    First Name
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={!isEditing}
                        className="w-full bg-transparent text-sm text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-500 dark:text-zinc-100 dark:disabled:text-zinc-400"
                      />
                      <span className="text-zinc-400">
                        <Icon name="user" />
                      </span>
                    </div>
                  </label>
                  <label className="text-xs text-zinc-500">
                    Last Name
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={!isEditing}
                        className="w-full bg-transparent text-sm text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-500 dark:text-zinc-100 dark:disabled:text-zinc-400"
                      />
                      <span className="text-zinc-400">
                        <Icon name="user" />
                      </span>
                    </div>
                  </label>

                  <label className="text-xs text-zinc-500">
                    Email{" "}
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                      Verified
                    </span>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled
                        className="w-full bg-transparent text-sm text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-500 dark:text-zinc-100 dark:disabled:text-zinc-400"
                      />
                      <span className="text-zinc-400">
                        <Icon name="mail" />
                      </span>
                    </div>
                  </label>

                  <label className="text-xs text-zinc-500">
                    Phone Number{" "}
                    {phone ? (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                        Verified
                      </span>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        placeholder="(000) 000-0000"
                        className="w-full bg-transparent text-sm text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-500 dark:text-zinc-100 dark:disabled:text-zinc-400"
                      />
                      <span className="text-zinc-400">
                        <Icon name="phone" />
                      </span>
                    </div>
                  </label>

                  <label className="text-xs text-zinc-500">
                    Date of Birth
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
                      <input
                        type="date"
                        value={dob?.slice(0, 10) || ""}
                        onChange={(e) => setDob(e.target.value)}
                        disabled={!isEditing}
                        className="w-full bg-transparent text-sm text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-500 dark:text-zinc-100 dark:disabled:text-zinc-400"
                      />
                      <span className="text-zinc-400">
                        <Icon name="calendar" />
                      </span>
                    </div>
                  </label>

                  <label className="text-xs text-zinc-500">
                    Country
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100 dark:disabled:text-zinc-400"
                    >
                      <option value="">Select…</option>
                      <option value="India">India</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Bangladesh">Bangladesh</option>
                    </select>
                  </label>

                  <label className="text-xs text-zinc-500 md:col-span-2">
                    Bio
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100 dark:disabled:text-zinc-400"
                      placeholder="Tell us about your business…"
                    />
                  </label>
                </div>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
                    {error}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {section === "integrations" ? (
            <>
              <div className="text-2xl font-semibold tracking-tight">Integrations</div>
              <div className="mt-2 text-sm text-zinc-500">
                Connect services to send messages, sync ads, and schedule meetings.
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {integrationCards.map((card) => {
                  const state = integrationState.get(card.platform);
                  const connected = Boolean(state?.is_active) || state?.status === "active";
                  return (
                    <div
                      key={card.platform}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{card.title}</div>
                          <div className="mt-1 text-xs text-zinc-500">{card.hint}</div>
                        </div>
                        <div className="text-xs">
                          {connected ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                              Connected
                            </span>
                          ) : (
                            <span className="rounded-full bg-zinc-100 px-2 py-1 font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                              Not connected
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-xs text-zinc-500">
                          {state?.connected_at ? `Connected ${new Date(state.connected_at).toLocaleDateString()}` : " "}
                        </div>
                        <div className="flex items-center gap-2">
                          {connected ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => disconnectIntegration(card.platform)}
                            >
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              className="rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                              onClick={() => setConnectTarget({ platform: card.platform, title: card.title, url: card.url })}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {section !== "account" && section !== "integrations" ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="text-2xl font-semibold tracking-tight">
                {sections.find((s) => s.key === section)?.label}
              </div>
              <div className="mt-2 text-sm text-zinc-500">
                This section is included in v1 UI, but the full workflow can be wired next.
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <IntegrationConnectModal
        open={!!connectTarget}
        onClose={() => setConnectTarget(null)}
        title={connectTarget?.title || "Connect"}
        platform={connectTarget?.platform || ""}
        connectUrl={connectTarget?.url}
        onConnect={(creds) => connectIntegration(connectTarget?.platform || "", creds)}
      />
    </div>
  );
}
