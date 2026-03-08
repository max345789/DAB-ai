"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postMeeting } from "@/lib/api";

export function MeetingScheduler() {
  const [title, setTitle] = useState("Campaign planning call");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    const result = await postMeeting({ title, date, time, notes });
    setStatus(result.success ? "success" : "error");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Meeting Booking
        </p>
        <p className="text-xs text-slate-500">
          Schedule a lead meeting and sync with the agent calendar.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-xs text-slate-500">
        Meeting title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-500">
          Time
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-xs text-slate-500">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-[110px] rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          placeholder="Add agenda or prep notes..."
        />
      </label>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {status === "success" && "Meeting request sent."}
          {status === "error" && "Unable to schedule meeting."}
        </p>
        <Button type="submit">Schedule meeting</Button>
      </div>
    </form>
  );
}
