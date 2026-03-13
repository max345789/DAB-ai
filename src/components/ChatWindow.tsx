"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { getChatHistory, postChat, type ChatMessage } from "@/lib/api";
import { ChatInput } from "@/components/ChatInput";
import { LeadForm } from "@/components/LeadForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

const greeting: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "What should we do first? You can ask me to create campaigns, follow up with leads, or review performance.",
  createdAt: new Date().toISOString(),
  status: "complete",
};

function getOrCreateSessionId() {
  if (typeof window === "undefined") return null;
  const key = "dab_ai_session_id_v1";
  const existing = window.localStorage.getItem(key);
  const parsed = existing ? Number(existing) : NaN;
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 2_147_483_647) return parsed;
  const next = Math.floor(Math.random() * 2_000_000_000) + 1;
  window.localStorage.setItem(key, String(next));
  return next;
}

export function ChatWindow() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const suggestedPrompts = useMemo(
    () => [
      "Follow up with yesterday leads",
      "Book meeting with John tomorrow",
      "Launch a campaign for luxury rentals",
    ],
    []
  );

  function detectLeadIntent(message: string) {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("marketing services") ||
      normalized.includes("need ads") ||
      normalized.includes("ads for my company") ||
      normalized.includes("i want marketing") ||
      normalized.includes("lead generation")
    );
  }

  function streamMessage(id: string, content: string) {
    let index = 0;
    if (streamRef.current) {
      clearInterval(streamRef.current);
    }
    streamRef.current = setInterval(() => {
      index += 1;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? {
                ...msg,
                content: content.slice(0, index),
                status: index >= content.length ? "complete" : "streaming",
              }
            : msg
        )
      );
      if (index >= content.length) {
        if (streamRef.current) {
          clearInterval(streamRef.current);
        }
        setIsSending(false);
      }
    }, 20);
  }

  async function handleSend(message: string) {
    setChatError(null);
    setLastPrompt(message);
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    const processingMessage: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: "Executing tasks...",
      createdAt: new Date().toISOString(),
      status: "processing",
    };
    setMessages((prev) => [...prev, userMessage, processingMessage]);
    if (detectLeadIntent(message)) {
      setShowLeadCapture(true);
    }
    setIsSending(true);

    try {
      const response = await postChat(message, {
        sessionId: sessionId ?? null,
        userId: user?.id ?? null,
      });

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        status: "streaming",
      };
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== processingMessage.id).concat(aiMessage)
      );
      streamMessage(aiMessage.id, response.reply);
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== processingMessage.id));
      setIsSending(false);
      setChatError(
        error instanceof Error ? error.message : "Could not reach chat service."
      );
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending, isLoadingHistory]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionId) {
        setMessages([greeting]);
        setIsLoadingHistory(false);
        return;
      }
      try {
        const history = await getChatHistory({ sessionId, userId: user?.id ?? null });
        if (cancelled) return;
        setMessages(history.length ? history : [greeting]);
      } catch (_e) {
        if (cancelled) return;
        setMessages([greeting]);
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, user?.id]);

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col">
      <div className="flex-1 overflow-y-auto px-1 pb-4 pt-4">
        <div className="space-y-6">
          {isLoadingHistory ? (
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Loading conversation…
              </span>
            </div>
          ) : null}

          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div key={message.id} className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {isUser ? "You" : "DAB AI"}
                  {message.status === "processing" ? " · Working" : ""}
                </div>
                <div
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                    isUser
                      ? "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100"
                      : "border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100",
                  ].join(" ")}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.status === "processing" ? (
                    <div className="mt-3 text-xs text-zinc-500">
                      Thinking…
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          <div ref={scrollAnchorRef} />
        </div>
      </div>

      {chatError ? (
        <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          <div>{chatError}</div>
          {lastPrompt ? (
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleSend(lastPrompt)}
              >
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3 pb-2">
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
              type="button"
              disabled={isSending}
            >
              {prompt}
            </button>
          ))}
        </div>
        <ChatInput onSend={handleSend} isSending={isSending} />
      </div>

      {showLeadCapture ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-6 backdrop-blur dark:bg-slate-950/70">
          <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-6 shadow-[0_40px_120px_rgba(0,0,0,0.2)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Capture lead details
                </p>
                <p className="text-xs text-slate-500">
                  This looks like lead intent. Grab quick contact details.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeadCapture(false)}
              >
                Close
              </Button>
            </div>
            <div className="mt-4">
              <LeadForm
                fields={["name", "email", "company"]}
                title="Lead capture"
                onSubmitted={() => setShowLeadCapture(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
