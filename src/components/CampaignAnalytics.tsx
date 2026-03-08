import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Campaign } from "@/lib/api";

type Props = {
  campaign: Campaign;
};

function SparklineBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-24 items-end gap-2">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex-1 rounded-lg bg-emerald-400/70"
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function CampaignAnalytics({ campaign }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              ${campaign.spendOverTime.reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">Leads Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {campaign.leadsGenerated}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {campaign.conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">Cost per Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              ${campaign.costPerLead.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend over time</CardTitle>
          </CardHeader>
          <CardContent>
            <SparklineBars values={campaign.spendOverTime} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads per day</CardTitle>
          </CardHeader>
          <CardContent>
            <SparklineBars values={campaign.leadsPerDay} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
