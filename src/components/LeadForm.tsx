"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postLead } from "@/lib/api";

type LeadField = "name" | "email" | "company" | "budget" | "message";

type Props = {
  fields?: LeadField[];
  onSubmitted?: () => void;
  title?: string;
};

const defaultFields: LeadField[] = [
  "name",
  "email",
  "company",
  "budget",
  "message",
];

export function LeadForm({ fields = defaultFields, onSubmitted, title }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    budget: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function updateField(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    const result = await postLead({
      name: form.name,
      email: form.email,
      company: form.company,
      budget: form.budget,
      message: form.message,
    });

    setIsSubmitting(false);
    if (result.success) {
      setStatus("success");
      setForm({ name: "", email: "", company: "", budget: "", message: "" });
      onSubmitted?.();
    } else {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
    >
      <div>
        <p className="text-sm font-semibold text-slate-100">
          {title ?? "Lead Capture"}
        </p>
        <p className="text-xs text-slate-500">
          Capture new inbound leads and assign them to campaigns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.includes("name") ? (
          <label className="flex flex-col gap-2 text-xs text-slate-500">
            Name
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
              placeholder="Full name"
              required
            />
          </label>
        ) : null}

        {fields.includes("email") ? (
          <label className="flex flex-col gap-2 text-xs text-slate-500">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
              placeholder="lead@company.com"
              required
            />
          </label>
        ) : null}

        {fields.includes("company") ? (
          <label className="flex flex-col gap-2 text-xs text-slate-500">
            Company
            <input
              value={form.company}
              onChange={(event) => updateField("company", event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
              placeholder="Company name"
              required
            />
          </label>
        ) : null}

        {fields.includes("budget") ? (
          <label className="flex flex-col gap-2 text-xs text-slate-500">
            Budget
            <input
              value={form.budget}
              onChange={(event) => updateField("budget", event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
              placeholder="$2,000"
            />
          </label>
        ) : null}
      </div>

      {fields.includes("message") ? (
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Message
          <textarea
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            className="min-h-[90px] rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            placeholder="Describe the lead request..."
          />
        </label>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {status === "success" && "Lead saved successfully."}
          {status === "error" && "Unable to submit. Try again."}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit lead"}
        </Button>
      </div>
    </form>
  );
}
