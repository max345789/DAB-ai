import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stages = [
  { label: "New Leads", value: 320, width: "100%" },
  { label: "Qualified Leads", value: 180, width: "70%" },
  { label: "Meetings Scheduled", value: 84, width: "45%" },
  { label: "Closed Deals", value: 36, width: "25%" },
];

export function LeadPipeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-700 dark:text-slate-200">
          Lead Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.label} className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{stage.label}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {stage.value}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200/80 dark:bg-slate-800">
              <div
                className={`h-3 rounded-full ${
                  index === 0
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                    : index === 1
                      ? "bg-gradient-to-r from-cyan-400 to-indigo-400"
                      : index === 2
                        ? "bg-gradient-to-r from-indigo-400 to-purple-400"
                        : "bg-gradient-to-r from-purple-400 to-rose-400"
                }`}
                style={{ width: stage.width }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
