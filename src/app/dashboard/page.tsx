import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { LeadPipeline } from "@/components/LeadPipeline";
import { CampaignTable } from "@/components/CampaignTable";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AutomationPanel } from "@/components/AutomationPanel";
import { InsightsPanel } from "@/components/InsightsPanel";
import { SystemHealth } from "@/components/SystemHealth";
import { getDashboard } from "@/lib/api";

export default async function DashboardPage() {
  const metrics = await getDashboard();
  const safeNumber = (value: number | null | undefined) => {
    const resolved = Number(value);
    return Number.isFinite(resolved) ? resolved : 0;
  };

  const totalLeads = safeNumber(metrics.totalLeads);
  const activeCampaigns = safeNumber(metrics.activeCampaigns);
  const adSpend = safeNumber(metrics.adSpend);
  const revenue = safeNumber(metrics.revenue);
  const costPerLead = safeNumber(metrics.costPerLead);
  const roas = safeNumber(metrics.roas);

  const metricCards = [
    {
      label: "Total Leads",
      value: totalLeads.toLocaleString(),
      change: "+12%",
      trend: [12, 16, 18, 22, 20, 24, 28],
      href: "/leads",
    },
    {
      label: "Active Campaigns",
      value: activeCampaigns.toString(),
      change: "+6%",
      trend: [3, 4, 4, 5, 6, 6, 6],
      href: "/campaigns",
    },
    {
      label: "Ad Spend",
      value: `$${adSpend.toLocaleString()}`,
      change: "+4.5%",
      trend: [2800, 3000, 3200, 3400, 3600, 3800, 3900],
      href: "/finance",
    },
    {
      label: "Revenue",
      value: `$${revenue.toLocaleString()}`,
      change: "+9.8%",
      trend: [6200, 7000, 7300, 7600, 7900, 8200, 8800],
      href: "/finance",
    },
    {
      label: "Cost per Lead",
      value: `$${costPerLead.toFixed(2)}`,
      change: "-2.1%",
      trend: [22, 21, 20, 19, 18.5, 18.2, 18.6],
      href: "/finance",
    },
    {
      label: "ROAS",
      value: `${roas.toFixed(2)}x`,
      change: "+0.3x",
      trend: [2.1, 2.3, 2.4, 2.6, 2.7, 2.7, 2.75],
      href: "/finance",
    },
  ];

  const spendChart = (metrics.spendOverTime ?? []).map((point) => ({
    date: point.date,
    value: point.spend,
  }));
  const leadsChart = (metrics.leadsOverTime ?? []).map((point) => ({
    date: point.date,
    value: point.leads,
  }));

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Hello, User
            </h1>
          </div>
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-200">
            System status: Operational
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here is the latest performance snapshot across campaigns, leads, and
          automation.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Ad Spend Over Time" data={spendChart} stroke="#38bdf8" />
        <ChartCard title="Leads Generated Over Time" data={leadsChart} stroke="#34d399" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
        <LeadPipeline />
        <ActivityFeed />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
        <AutomationPanel />
        <InsightsPanel />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <CampaignTable />
        <SystemHealth />
      </section>
    </div>
  );
}
