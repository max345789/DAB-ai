const tasks = [
  "Monitoring campaign spend across Meta and Google",
  "Preparing follow-up sequences for warm leads",
  "Optimizing ad creative for high-intent segments",
];

const decisions = [
  "Increased budget on Luxury Buyers Q2 by 10%",
  "Paused Starter Awareness due to high CPL",
  "Rescheduled follow-up to tomorrow 9 AM",
];

const alerts = [
  "CPL exceeded $22 on Rental Demand Surge",
  "New lead spike detected from Google Ads",
];

export default function CommandCenterPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Command Center
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Autonomous Agent Monitor
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track decisions, tasks, and system alerts in real time.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Current Agent Tasks
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {tasks.map((task) => (
              <li
                key={task}
                className="rounded-xl border border-white/10 bg-white/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
              >
                {task}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Agent Status
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Running autonomously with guardrails enabled.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                className="rounded-xl bg-rose-500/80 px-4 py-2 text-xs text-white"
                type="button"
              >
                Pause Agent
              </button>
              <button
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-300"
                type="button"
              >
                Manual Override
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              System Alerts
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {alerts.map((alert) => (
                <li
                  key={alert}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-100"
                >
                  {alert}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Recent Decisions
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          {decisions.map((decision) => (
            <li
              key={decision}
              className="rounded-xl border border-white/10 bg-white/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
            >
              {decision}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
