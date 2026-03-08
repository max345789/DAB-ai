"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postCampaign } from "@/lib/api";

export function CampaignForm() {
  const [form, setForm] = useState({
    name: "",
    product: "",
    audience: "",
    platform: "Meta",
    dailyBudget: "",
    location: "",
    goal: "Lead Generation",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    const result = await postCampaign({
      name: form.name,
      platform: form.platform as "Meta" | "Google" | "LinkedIn",
      dailyBudget: Number(form.dailyBudget),
      audience: form.audience,
      productService: form.product,
      location: form.location,
      goal: form.goal as "Lead Generation" | "Traffic" | "Sales",
      generatedAd: {
        headline: form.product,
        description: form.location,
        cta: "Learn more",
      },
    });

    setIsSubmitting(false);
    setStatus(result.success ? "success" : "error");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
    >
      <div>
        <p className="text-sm font-semibold text-slate-100">Create Campaign</p>
        <p className="text-xs text-slate-500">
          Launch a new paid campaign and send details to DAB AI.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Campaign Name
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            placeholder="Dental Leads Dubai"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Product / Service
          <input
            value={form.product}
            onChange={(event) => updateField("product", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            placeholder="Cosmetic dentistry"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Target Audience
          <input
            value={form.audience}
            onChange={(event) => updateField("audience", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            placeholder="Working professionals, 25-45"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Platform
          <select
            value={form.platform}
            onChange={(event) => updateField("platform", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          >
            <option>Meta</option>
            <option>Google</option>
            <option>LinkedIn</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Daily Budget
          <input
            value={form.dailyBudget}
            onChange={(event) => updateField("dailyBudget", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            placeholder="$300"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Location
          <input
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            placeholder="Dubai, UAE"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500 md:col-span-2">
          Goal
          <select
            value={form.goal}
            onChange={(event) => updateField("goal", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          >
            <option>Lead Generation</option>
            <option>Traffic</option>
            <option>Sales</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {status === "success" && "Campaign created successfully."}
          {status === "error" && "Unable to create campaign."}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Launch campaign"}
        </Button>
      </div>
    </form>
  );
}
