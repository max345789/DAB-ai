"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postCampaignBudget } from "@/lib/api";

type Rule = {
  id: string;
  text: string;
};

export function BudgetControlPanel({ campaignId }: { campaignId: string }) {
  const [dailyBudget, setDailyBudget] = useState(300);
  const [paused, setPaused] = useState(false);
  const [rules, setRules] = useState<Rule[]>([
    { id: "rule_1", text: "Pause if CPL > $20" },
    { id: "rule_2", text: "Increase budget if conversion rate > 5%" },
  ]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function increaseBudget(amount: number) {
    setDailyBudget((prev) => prev + amount);
  }

  async function handleSave() {
    const result = await postCampaignBudget({
      id: campaignId,
      dailyBudget,
      paused,
      rules: rules.map((rule) => rule.text),
    });
    setStatus(result.success ? "success" : "error");
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Budget Management
        </p>
        <p className="text-xs text-slate-500">
          Control daily spend and automation rules.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-xs text-slate-500">Daily Budget</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          ${dailyBudget}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => increaseBudget(50)}>
            +$50
          </Button>
          <Button variant="secondary" size="sm" onClick={() => increaseBudget(100)}>
            +$100
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDailyBudget((prev) => Math.max(prev - 50, 0))}
          >
            -$50
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/60 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/50">
        <span className="text-slate-600 dark:text-slate-300">Pause campaign</span>
        <button
          type="button"
          onClick={() => setPaused((prev) => !prev)}
          className={`h-6 w-12 rounded-full p-1 transition ${
            paused ? "bg-rose-500/70" : "bg-slate-300 dark:bg-slate-700"
          }`}
        >
          <span
            className={`block h-4 w-4 rounded-full bg-white transition ${
              paused ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Automatic budget rules
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between">
              <span>{rule.text}</span>
              <button
                type="button"
                className="text-xs text-slate-500"
                onClick={() =>
                  setRules((prev) => prev.filter((item) => item.id !== rule.id))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-xs text-emerald-400"
          onClick={() =>
            setRules((prev) => [
              ...prev,
              { id: `rule_${prev.length + 1}`, text: "New rule" },
            ])
          }
        >
          + Add rule
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {status === "success" && "Budget rules saved."}
          {status === "error" && "Unable to save budget rules."}
        </p>
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </div>
  );
}
