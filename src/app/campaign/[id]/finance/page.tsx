import { notFound } from "next/navigation";
import { CampaignFinancePanel } from "@/components/CampaignFinancePanel";
import { BudgetControlPanel } from "@/components/BudgetControlPanel";
import { getCampaignFinance } from "@/lib/api";

type Props = {
  params: { id: string };
};

export default async function CampaignFinancePage({ params }: Props) {
  const finance = await getCampaignFinance(params.id);

  if (!finance) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Campaign Finance
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Financial Overview
        </h1>
        <p className="text-sm text-slate-400">
          Monitor spend, revenue, and efficiency metrics for this campaign.
        </p>
      </header>

      <div className="flex gap-3 text-xs">
        <a
          href={`/campaigns/${params.id}`}
          className="rounded-full border border-slate-800 px-4 py-2 text-slate-400 transition hover:border-slate-600 hover:text-slate-100"
        >
          Overview
        </a>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100">
          Financials
        </span>
      </div>

      <CampaignFinancePanel finance={finance} />
      <BudgetControlPanel campaignId={params.id} />
    </div>
  );
}
