import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinanceSummary } from "@/lib/api";

type Props = {
  summary: FinanceSummary;
};

export function ExpenseCards({ summary }: Props) {
  const cards = [
    {
      label: "Total Ad Spend",
      value: `$${summary.totalAdSpend.toLocaleString()}`,
    },
    {
      label: "Total Revenue",
      value: `$${summary.totalRevenue.toLocaleString()}`,
    },
    {
      label: "Cost per Lead",
      value: `$${summary.costPerLead.toFixed(2)}`,
    },
    {
      label: "ROAS",
      value: `${summary.roas.toFixed(2)}x`,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardTitle className="text-sm text-slate-400">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
