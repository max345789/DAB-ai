"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postFollowup } from "@/lib/api";

export function FollowUpPanel() {
  const [delayValue, setDelayValue] = useState("30");
  const [delayUnit, setDelayUnit] = useState("minutes");
  const [attempts, setAttempts] = useState(3);
  const [template, setTemplate] = useState(
    "Hi {{name}}, just checking in on your campaign goals."
  );
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    const result = await postFollowup({
      delay: `${delayValue} ${delayUnit}`,
      attempts,
      template,
    });
    setStatus(result.success ? "success" : "error");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Follow-up Control Panel
        </p>
        <p className="text-xs text-slate-500">
          Configure automated follow-up cadence for new leads.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Follow-up delay
          <div className="flex gap-2">
            <input
              value={delayValue}
              onChange={(event) => setDelayValue(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            />
            <select
              value={delayUnit}
              onChange={(event) => setDelayUnit(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        </label>

        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Number of attempts
          <input
            type="number"
            min={1}
            value={attempts}
            onChange={(event) => setAttempts(Number(event.target.value))}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-xs text-slate-500">
        Message template
        <textarea
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          className="min-h-[110px] rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
        />
      </label>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {status === "success" && "Follow-up automation saved."}
          {status === "error" && "Unable to save. Try again."}
        </p>
        <Button type="submit">Save automation</Button>
      </div>
    </form>
  );
}
