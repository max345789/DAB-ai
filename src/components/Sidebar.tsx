"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", enabled: true },
  { label: "Chat Agent", href: "/chat", enabled: true },
  { label: "Leads", href: "/leads", enabled: true },
  { label: "Campaigns", href: "/campaigns", enabled: true },
  { label: "Finance", href: "/finance", enabled: true },
  { label: "Automation", href: "/automation", enabled: true },
  { label: "Integrations", href: "/integrations", enabled: true },
  { label: "Command Center", href: "/command-center", enabled: true },
  { label: "Reports", href: "/reports", enabled: true },
  { label: "Settings", href: "/settings", enabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-[720px] w-[240px] flex-col gap-6 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/80 via-cyan-400/80 to-emerald-400/80 text-sm font-bold text-slate-950">
          D
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            DAB AI
          </p>
          <p className="text-lg font-semibold text-slate-100">Workspace</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const base =
            "flex items-center justify-between rounded-xl px-4 py-3 text-sm transition";
          if (!item.enabled) {
            return (
              <div
                key={item.label}
                className={`${base} cursor-not-allowed text-slate-500/70`}
              >
                <span>{item.label}</span>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`${base} ${
                isActive
                  ? "bg-slate-900 text-slate-50 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                  : "text-slate-300 hover:bg-slate-900/60"
              }`}
            >
              <span>{item.label}</span>
              {isActive ? (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-200">Agent status</p>
        <p className="mt-1">Monitoring spend and inbound leads.</p>
      </div>
    </aside>
  );
}
