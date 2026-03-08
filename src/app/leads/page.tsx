import { LeadForm } from "@/components/LeadForm";
import { LeadTable } from "@/components/LeadTable";

export default function LeadsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Pipeline
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Lead Management
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Search, qualify, and activate inbound leads across campaigns.
        </p>
      </header>

      <LeadTable />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-white/10 bg-white/70 p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Lead Insights
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Identify high-intent prospects and assign them to your best
            performing campaigns.
          </p>
          <div className="mt-4 space-y-3 text-xs text-slate-500">
            <div className="rounded-xl border border-white/10 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              42% of leads responded within 24 hours.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Top source: Meta Ads (58%).
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Warm leads need a follow-up in the next 2 days.
            </div>
          </div>
        </div>
        <LeadForm />
      </div>
    </div>
  );
}
