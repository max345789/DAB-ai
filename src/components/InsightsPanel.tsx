import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const insights = [
  "Campaign targeting dentists shows strong ROI.",
  "Leads from LinkedIn convert better than Meta Ads.",
  "Best lead conversion time: 6–9 PM.",
];

export function InsightsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-700 dark:text-slate-200">
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        {insights.map((insight) => (
          <div
            key={insight}
            className="rounded-xl border border-white/10 bg-white/60 px-4 py-3 shadow-sm dark:bg-white/5"
          >
            {insight}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
