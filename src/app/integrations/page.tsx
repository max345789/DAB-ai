const integrations = [
  { name: "Meta Ads", status: "Connected" },
  { name: "Google Ads", status: "Connected" },
  { name: "WhatsApp", status: "Pending" },
  { name: "Email", status: "Connected" },
  { name: "Calendar", status: "Pending" },
];

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Integrations
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Connected Platforms
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage ad networks, messaging, and calendar integrations.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {integration.name}
              </p>
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  integration.status === "Connected"
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                    : "border-amber-500/40 bg-amber-500/20 text-amber-200"
                }`}
              >
                {integration.status}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Sync data and control campaigns directly from DAB AI.
            </p>
            <button
              className="mt-4 rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
              type="button"
            >
              {integration.status === "Connected" ? "Manage" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
