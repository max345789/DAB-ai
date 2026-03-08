import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignFinance } from "@/lib/api";

type Props = {
  finance: CampaignFinance;
};

const indicatorMap = {
  profitable: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  moderate: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  losing: "bg-rose-500/20 text-rose-200 border-rose-500/40",
};

export function CampaignFinancePanel({ finance }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Daily Spend", value: `$${finance.dailySpend}` },
          { label: "Leads Generated", value: finance.leadsGenerated },
          { label: "Revenue", value: `$${finance.revenue}` },
          { label: "Cost per Lead", value: `$${finance.costPerLead.toFixed(2)}` },
          { label: "Conversion Rate", value: `${finance.conversionRate}%` },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {item.value}
            </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Indicator</CardTitle>
        </CardHeader>
        <CardContent>
          <span
            className={`inline-flex rounded-full border px-4 py-2 text-sm ${indicatorMap[finance.trend]}`}
          >
            {finance.trend === "profitable"
              ? "Green: profitable"
              : finance.trend === "moderate"
                ? "Yellow: moderate"
                : "Red: losing money"}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
