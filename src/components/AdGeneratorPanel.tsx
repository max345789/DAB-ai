"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postCampaignGenerate } from "@/lib/api";

export function AdGeneratorPanel() {
  const [prompt, setPrompt] = useState(
    "Create a campaign for dentists in Dubai with $300 budget."
  );
  const [result, setResult] = useState<{
    headline: string;
    description: string;
    cta: string;
    audience: string;
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  async function handleGenerate() {
    setStatus("loading");
    const data = await postCampaignGenerate({ prompt });
    setResult(data);
    setStatus("idle");
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          AI Campaign Generator
        </p>
        <p className="text-xs text-slate-500">
          Generate ad copy and targeting suggestions from a brief.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-xs text-slate-500">
        Prompt
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-[90px] rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
        />
      </label>

      <Button onClick={handleGenerate} disabled={status === "loading"}>
        {status === "loading" ? "Generating..." : "Generate campaign"}
      </Button>

      {result ? (
        <div className="rounded-2xl border border-white/10 bg-white/60 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500">Output</p>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-xs text-slate-500">Ad headline</p>
              <p className="text-sm text-slate-900 dark:text-slate-100">
                {result.headline}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ad description</p>
              <p className="text-sm text-slate-900 dark:text-slate-100">
                {result.description}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Call to action</p>
              <p className="text-sm text-slate-900 dark:text-slate-100">
                {result.cta}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Audience targeting</p>
              <p className="text-sm text-slate-900 dark:text-slate-100">
                {result.audience}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm">Approve & launch</Button>
            <Button size="sm" variant="secondary">
              Edit prompt
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
