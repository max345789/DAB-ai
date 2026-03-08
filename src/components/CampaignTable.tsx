"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { type CampaignStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCampaigns } from "@/hooks/useCampaigns";

const statusStyles: Record<CampaignStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  paused: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  draft: "bg-slate-500/20 text-slate-200 border-slate-500/40",
};

export function CampaignTable() {
  const { campaigns, setCampaigns, isLoading } = useCampaigns();
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return campaigns.filter((campaign) =>
      campaign.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [campaigns, query]);

  function pauseCampaign(id: string) {
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === id ? { ...campaign, status: "paused" } : campaign
      )
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search campaigns..."
          className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-100 md:max-w-sm"
        />
        <Link href="/campaigns/create">
          <Button>Create Campaign</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/40 backdrop-blur dark:border-white/10 dark:bg-white/5">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="bg-white/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/70">
            <tr>
              <th className="px-4 py-3">Campaign Name</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Spend</th>
              <th className="px-4 py-3">Cost per Lead</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-white/10 bg-white/30 dark:border-slate-900/60 dark:bg-slate-950/40">
                <td className="px-4 py-6 text-sm text-slate-400" colSpan={8}>
                  Loading campaigns...
                </td>
              </tr>
            ) : null}
            {filtered.map((campaign) => (
              <tr
                key={campaign.id}
                className="border-t border-white/10 bg-white/30 dark:border-slate-900/60 dark:bg-slate-950/40"
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {campaign.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {campaign.platform}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  ${campaign.dailyBudget}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {campaign.leadsGenerated}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  ${campaign.spend.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  ${campaign.costPerLead.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      statusStyles[campaign.status]
                    }`}
                  >
                    {campaign.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => pauseCampaign(campaign.id)}
                    >
                      Pause
                    </Button>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                    >
                      View analytics
                    </Link>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                      type="button"
                      aria-label="Row actions"
                      onClick={() =>
                        setOpenMenuId((prev) =>
                          prev === campaign.id ? null : campaign.id
                        )
                      }
                    >
                      ⋯
                    </button>
                    {openMenuId === campaign.id ? (
                      <div className="absolute right-0 top-12 z-10 w-40 rounded-xl border border-white/20 bg-white/90 p-2 text-left text-xs text-slate-700 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Open details
                        </Link>
                        <button
                          type="button"
                          onClick={() => pauseCampaign(campaign.id)}
                          className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Pause campaign
                        </button>
                        <button
                          type="button"
                          className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Run optimization
                        </button>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid gap-3 p-4 md:hidden">
          {filtered.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-xl border border-white/10 bg-white/60 p-4 shadow-sm dark:bg-white/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {campaign.name}
                  </p>
                  <p className="text-xs text-slate-500">{campaign.platform}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] ${
                    statusStyles[campaign.status]
                  }`}
                >
                  {campaign.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <p>Budget ${campaign.dailyBudget}</p>
                <p className="mt-1">Leads {campaign.leadsGenerated}</p>
                <p className="mt-1">Spend ${campaign.spend.toLocaleString()}</p>
                <p className="mt-1">
                  CPL ${campaign.costPerLead.toFixed(2)}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => pauseCampaign(campaign.id)}
                >
                  Pause
                </Button>
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
                >
                  View analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
