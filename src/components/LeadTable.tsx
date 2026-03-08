"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { type LeadStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";

const statusOptions: Array<LeadStatus | "all"> = [
  "all",
  "hot",
  "warm",
  "cold",
];

const statusStyles: Record<LeadStatus, string> = {
  hot: "bg-rose-500/20 text-rose-200 border-rose-500/40",
  warm: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  cold: "bg-sky-500/20 text-sky-200 border-sky-500/40",
};

export function LeadTable() {
  const { leads, setLeads, isLoading } = useLeads();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesQuery =
        lead.name.toLowerCase().includes(query.toLowerCase()) ||
        lead.email.toLowerCase().includes(query.toLowerCase()) ||
        lead.company.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || lead.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [leads, query, status]);

  function markContacted(id: string) {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? { ...lead, status: "warm", lastContacted: "Just now" }
          : lead
      )
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search leads..."
            className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-100 md:max-w-sm"
          />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | LeadStatus)
            }
            className="h-11 rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-100"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All statuses"
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500">
          {filtered.length} leads found
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/40 backdrop-blur dark:border-white/10 dark:bg-white/5">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="bg-white/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/70">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lead Score</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-white/10 bg-white/30 dark:border-slate-900/60 dark:bg-slate-950/40">
                <td className="px-4 py-6 text-sm text-slate-400" colSpan={8}>
                  Loading leads...
                </td>
              </tr>
            ) : null}
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                className="border-t border-white/10 bg-white/30 dark:border-slate-900/60 dark:bg-slate-950/40"
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {lead.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {lead.email}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {lead.company}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      statusStyles[lead.status]
                    }`}
                  >
                    {lead.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-200">
                    {lead.leadScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {lead.source}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {lead.createdAt}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => markContacted(lead.id)}
                    >
                      Mark contacted
                    </Button>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                    >
                      Open
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid gap-3 p-4 md:hidden">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-white/10 bg-white/60 p-4 shadow-sm dark:bg-white/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {lead.name}
                  </p>
                  <p className="text-xs text-slate-500">{lead.company}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] ${
                    statusStyles[lead.status]
                  }`}
                >
                  {lead.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <p>{lead.email}</p>
                <p className="mt-1">Score {lead.leadScore}</p>
                <p className="mt-1">{lead.source}</p>
                <p className="mt-1">Created {lead.createdAt}</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => markContacted(lead.id)}
                >
                  Mark contacted
                </Button>
                <Link
                  href={`/leads/${lead.id}`}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
