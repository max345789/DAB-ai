import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const systems = [
  { label: "Backend API", status: "Healthy" },
  { label: "Database", status: "Healthy" },
  { label: "Automation Engine", status: "Degraded" },
  { label: "Integrations", status: "Healthy" },
];

const statusStyles: Record<string, string> = {
  Healthy: "bg-emerald-400",
  Degraded: "bg-amber-400",
  Down: "bg-rose-400",
};

export function SystemHealth() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-700 dark:text-slate-200">
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        {systems.map((system) => (
          <div key={system.label} className="flex items-center justify-between">
            <span>{system.label}</span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className={`h-2.5 w-2.5 rounded-full ${statusStyles[system.status]}`}
              />
              {system.status}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
