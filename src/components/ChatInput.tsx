"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";

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

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Auto-size.
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (isSending) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Message DAB AI…"
        className="min-h-[72px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100/10"
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          if (event.shiftKey) return; // newline

          // Send on Enter. Use Cmd/Ctrl+Enter as an alternative.
          // `isComposing` isn't typed on React KeyboardEvent in all TS versions.
          const native = event.nativeEvent as unknown as { isComposing?: boolean };
          if (event.metaKey || event.ctrlKey || !native?.isComposing) {
            event.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span>
          Enter to send · Shift+Enter for newline
        </span>
        <Button
          onClick={handleSubmit}
          disabled={isSending || !value.trim()}
          className="rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              Sending
            </span>
          ) : (
            "Send"
          )}
        </Button>
      </div>
    </div>
  );
}
