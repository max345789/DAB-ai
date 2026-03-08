export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Settings
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Platform Preferences
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure AI strategy, budget limits, and user preferences.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            User Preferences
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              Notification frequency: Daily summary
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              Timezone: Asia/Kolkata
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            AI Strategy
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              Autonomy level: Balanced
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              Approval required for budget changes over 15%
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Budget Limits
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Daily spend cap: $5,000
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Monthly cap: $95,000
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Max CPL: $25
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
