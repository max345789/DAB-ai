"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getOptimizationSuggestions,
  type OptimizationSuggestion,
} from "@/lib/api";

export function OptimizationPanel() {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);

  useEffect(() => {
    getOptimizationSuggestions().then(setSuggestions);
  }, []);

  function handleIgnore(id: string) {
    setSuggestions((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          AI Optimization Suggestions
        </p>
        <p className="text-xs text-slate-500">
          Recommendations based on spend, CPL, and conversion rate.
        </p>
      </div>

      <div className="space-y-3">
        {suggestions.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-white/60 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200"
          >
            <p>{item.message}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm">Apply suggestion</Button>
              <Button size="sm" variant="secondary" onClick={() => handleIgnore(item.id)}>
                Ignore suggestion
              </Button>
            </div>
          </div>
        ))}
        {suggestions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/60 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
            No new suggestions right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}
