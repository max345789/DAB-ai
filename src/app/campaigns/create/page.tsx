import { CampaignForm } from "@/components/CampaignForm";
import { AdGeneratorPanel } from "@/components/AdGeneratorPanel";

export default function CreateCampaignPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          New Campaign
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Create Campaign
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Fill the details or generate a campaign plan with DAB AI.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <CampaignForm />
        <AdGeneratorPanel />
      </div>
    </div>
  );
}
