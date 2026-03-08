import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/api";

type Props = {
  metrics: DashboardMetrics;
};

const cardConfig = [
  { label: "Total Leads", key: "totalLeads" },
  { label: "Active Campaigns", key: "activeCampaigns" },
  { label: "Ad Spend", key: "adSpend" },
  { label: "Cost per Lead", key: "costPerLead" },
  { label: "Revenue", key: "revenue" },
  { label: "ROAS", key: "roas" },
] as const;

export function DashboardCards({ metrics }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cardConfig.map((card) => {
        const value = metrics[card.key];
        const display =
          card.key === "adSpend" || card.key === "revenue"
            ? `$${Number(value).toLocaleString()}`
            : card.key === "costPerLead"
              ? `$${Number(value).toFixed(2)}`
            : card.key === "roas"
                ? `${Number(value).toFixed(2)}x`
                : value;
        return (
          <Card key={card.label} className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900/10 via-transparent to-slate-900/50" />
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-50">{display}</p>
              <p className="mt-2 text-xs text-slate-500">
                Updated in real time
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
