import { FollowUpPanel } from "@/components/FollowUpPanel";
import { MeetingScheduler } from "@/components/MeetingScheduler";
import { AutomationBuilder } from "@/components/AutomationBuilder";

export default function AutomationPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Automation
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Follow-up & Scheduling
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure automated follow-ups and schedule meetings with leads.
        </p>
      </header>

      <AutomationBuilder />

      <div className="grid gap-6 lg:grid-cols-2">
        <FollowUpPanel />
        <MeetingScheduler />
      </div>
    </div>
  );
}
