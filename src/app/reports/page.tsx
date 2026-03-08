const reportSections = [
  {
    title: "Campaign Insights",
    items: [
      "Luxury Buyers Q2 outperformed benchmarks by 18%.",
      "Rental Demand Surge improved CTR after creative refresh.",
    ],
  },
  {
    title: "Budget Changes",
    items: [
      "Increased daily budget for Luxury Buyers Q2 by $50.",
      "Paused Starter Awareness due to CPL spike.",
    ],
  },
  {
    title: "Automation Activity",
    items: [
      "Triggered 14 follow-up sequences for warm leads.",
      "Scheduled 6 meetings with qualified prospects.",
    ],
  },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Reports
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Daily AI Report
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Summary of campaign performance, budget changes, and automation events.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {reportSections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {section.title}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
