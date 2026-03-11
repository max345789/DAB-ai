import { ExpenseCards } from "@/components/ExpenseCards";
import { SpendChart } from "@/components/SpendChart";
import { BudgetControlPanel } from "@/components/BudgetControlPanel";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { ApiErrorState } from "@/components/ApiErrorState";
import { getFinanceSummary } from "@/lib/api";

export default async function FinancePage() {
  let summary;

  try {
    summary = await getFinanceSummary();
  } catch (error) {
    return (
      <ApiErrorState
        title="Finance dashboard unavailable"
        message={
          error instanceof Error
            ? error.message
            : "Could not load finance data."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Finance
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Expense Dashboard
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track spend efficiency, revenue, and campaign profitability.
        </p>
      </header>

      <ExpenseCards summary={summary} />
      <SpendChart summary={summary} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <BudgetControlPanel campaignId="camp_1" />
        <OptimizationPanel />
      </div>
    </div>
  );
}
