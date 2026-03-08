"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onSend: (message: string) => void;
  isSending?: boolean;
};

export function ChatInput({ onSend, isSending }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask DAB AI to create ads, follow up, or book meetings..."
        className="min-h-[84px] w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus-visible:ring-slate-400 dark:focus-visible:ring-offset-slate-950"
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Press Cmd + Enter to send</span>
        <Button
          onClick={handleSubmit}
          disabled={isSending}
          className="rounded-xl"
        >
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
