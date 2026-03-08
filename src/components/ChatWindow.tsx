"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { postChat, type ChatMessage } from "@/lib/api";
import { ChatInput } from "@/components/ChatInput";
import { Card } from "@/components/ui/card";
import { LeadForm } from "@/components/LeadForm";
import { Button } from "@/components/ui/button";

const seedMessages: ChatMessage[] = [
  {
    id: "seed_1",
    role: "assistant",
    content:
      "Hi! I can launch campaigns, follow up with leads, and coordinate meetings. What should we do first?",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed_2",
    role: "user",
    content: "Create ad campaign for real estate leads. Budget $200.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed_3",
    role: "assistant",
    content:
      "Got it. I will draft two ad variants and start targeting high-intent buyers.",
    createdAt: new Date().toISOString(),
  },
];

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [isSending, setIsSending] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const response = await postChat(message);

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
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col gap-6">
      <Card className="flex-1 overflow-hidden border-white/10 bg-white/70 dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/70 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  DAB AI Assistant
                </p>
                <p className="text-xs text-slate-500">
                  Always-on marketing operations
                </p>
              </div>
              {isSending ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                  Executing tasks
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isUser
                        ? "bg-gradient-to-br from-emerald-400/90 via-cyan-400/90 to-indigo-500/90 text-slate-950"
                        : "border border-white/30 bg-white/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                    {message.status === "processing" ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Task queue running...
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200/70 px-6 py-4 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <ChatInput onSend={handleSend} isSending={isSending} />

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
