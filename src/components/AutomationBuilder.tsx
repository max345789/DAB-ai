"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const triggerOptions = ["New lead", "High conversion rate", "Low ROAS"];
const conditionOptions = ["Lead score > 80", "CPL < $20", "ROAS > 2.5x"];
const actionOptions = ["Send follow-up", "Increase budget", "Pause campaign"];

export function AutomationBuilder() {
  const [trigger, setTrigger] = useState(triggerOptions[0]);
  const [condition, setCondition] = useState(conditionOptions[0]);
  const [action, setAction] = useState(actionOptions[0]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Automation Rule Builder
        </p>
        <p className="text-xs text-slate-500">
          Connect triggers, conditions, and actions for autonomous workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Trigger
          <select
            value={trigger}
            onChange={(event) => setTrigger(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          >
            {triggerOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Condition
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          >
            {conditionOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Action
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          >
            {actionOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Preview
        </p>
        <p className="mt-2">
          {trigger} → {condition} → {action}
        </p>
      </div>

      <div className="flex justify-end">
        <Button>Save rule</Button>
      </div>
    </div>
  );
}
