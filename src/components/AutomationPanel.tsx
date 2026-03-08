import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  { label: "Follow-ups sent", done: true },
  { label: "Meetings scheduled", done: true },
  { label: "Campaign optimization", done: false },
  { label: "Lead scoring tasks", done: true },
];

export function AutomationPanel() {
  const completed = items.filter((item) => item.done).length;
  const progress = Math.round((completed / items.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-700 dark:text-slate-200">
          Automation Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  item.done ? "bg-emerald-400" : "bg-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
