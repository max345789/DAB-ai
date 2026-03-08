import { CampaignTable } from "@/components/CampaignTable";

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Campaigns
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Campaign Management
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage paid campaigns across platforms and track lead generation.
        </p>
      </header>

      <CampaignTable />
    </div>
  );
}
