"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lead } from "@/lib/api";

type Props = {
  lead: Lead;
};

export function LeadProfile({ lead }: Props) {
  const [status, setStatus] = useState(lead.status);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Lead Profile
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          {lead.name}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {lead.company}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span>{lead.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Source</span>
              <span>{lead.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lead Score</span>
              <span>{lead.leadScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span>{lead.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Meeting Status</span>
              <span>
                {lead.meetingStatus === "scheduled"
                  ? "Scheduled"
                  : lead.meetingStatus === "pending"
                    ? "Pending"
                    : "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Campaign Attribution</span>
              <span>{lead.attribution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Budget</span>
              <span>{lead.budget ?? "Not provided"}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              {lead.message ?? "No notes on this lead yet."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Lead temperature
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {status.toUpperCase()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStatus("hot")}>
                Mark hot
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setStatus("warm")}>
                Mark warm
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setStatus("cold")}>
                Mark cold
              </Button>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500">Assigned campaign</p>
              <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
                {lead.assignedCampaign ?? "Unassigned"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          {(lead.history ?? []).length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/60 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              No conversation history yet.
            </div>
          ) : (
            (lead.history ?? []).map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-white/10 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {entry.by === "agent" ? "Agent" : "Lead"} · {entry.date}
                </p>
                <p className="mt-2">{entry.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button>Send follow-up</Button>
        <Button variant="secondary">Book meeting</Button>
        <Button variant="secondary">Mark qualified</Button>
      </div>
    </div>
  );
}
