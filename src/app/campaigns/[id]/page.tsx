import { notFound } from "next/navigation";
import { CampaignAnalytics } from "@/components/CampaignAnalytics";
import { BudgetControlPanel } from "@/components/BudgetControlPanel";
import { getCampaign } from "@/lib/api";

type Props = {
  params: { id: string };
};

export default async function CampaignDetailPage({ params }: Props) {
  const campaign = await getCampaign(params.id);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Campaign
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          {campaign.name}
        </h1>
        <p className="text-sm text-slate-400">
          {campaign.platform} · {campaign.goal ?? "Lead Generation"}
        </p>
      </header>

      <div className="flex gap-3 text-xs">
        <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100">
          Overview
        </span>
        <a
          href={`/campaign/${campaign.id}/finance`}
          className="rounded-full border border-slate-800 px-4 py-2 text-slate-400 transition hover:border-slate-600 hover:text-slate-100"
        >
          Financials
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Ad Content
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500">Headline</p>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {campaign.generatedAd?.headline ?? "Headline pending approval"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500">Description</p>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {campaign.generatedAd?.description ??
                  "Description pending approval"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500">Call to action</p>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {campaign.generatedAd?.cta ?? "Schedule a demo"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Target Audience
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {campaign.audience ?? "Audience targeting not set."}
          </p>
          <div className="mt-6 grid gap-3 text-xs text-slate-400">
            <div className="rounded-xl border border-white/10 bg-white/60 p-3 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Product: {campaign.productService ?? "Not specified"}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-3 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Location: {campaign.location ?? "Global"}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-3 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Daily budget: ${campaign.dailyBudget}
            </div>
          </div>
        </div>
      </div>

      <CampaignAnalytics campaign={campaign} />
      <BudgetControlPanel campaignId={params.id} />
    </div>
  );
}
