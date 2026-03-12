import { ApiErrorState } from "@/components/ApiErrorState";
import { getDashboard } from "@/lib/api";

export default async function DashboardPage() {
  let metrics;

  try {
    metrics = await getDashboard();
  } catch (error) {
    return (
      <ApiErrorState
        title="Dashboard unavailable"
        message={
          error instanceof Error
            ? error.message
            : "Could not load dashboard data."
        }
      />
    );
  }

  const safeNumber = (value: number | null | undefined) => {
    const resolved = Number(value);
    return Number.isFinite(resolved) ? resolved : 0;
  };

  const totalLeads = safeNumber(metrics.totalLeads);
  const activeCampaigns = safeNumber(metrics.activeCampaigns);
  const adSpend = safeNumber(metrics.adSpend);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          A small snapshot of leads and spend. Keep it simple.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="text-xs font-medium text-zinc-500">Total leads</div>
          <div className="mt-2 text-2xl font-semibold">{totalLeads.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="text-xs font-medium text-zinc-500">Active campaigns</div>
          <div className="mt-2 text-2xl font-semibold">{activeCampaigns}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="text-xs font-medium text-zinc-500">Ad spend (30d)</div>
          <div className="mt-2 text-2xl font-semibold">${adSpend.toLocaleString()}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="text-sm font-semibold">Recent actions</div>
        <div className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
          {(metrics.recentActions ?? []).slice(0, 6).map((item) => (
            <div key={item} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
