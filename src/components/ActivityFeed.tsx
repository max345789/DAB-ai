import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  "Campaign created for Dubai real estate leads",
  "Follow-up message sent to 12 warm leads",
  "Budget optimized for Luxury Buyers Q2",
  "Campaign paused due to CPL threshold",
];

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-700 dark:text-slate-200">
          Agent Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        {activities.map((activity) => (
          <div
            key={activity}
            className="rounded-xl border border-white/10 bg-white/50 px-4 py-3 shadow-sm dark:bg-white/5"
          >
            {activity}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
