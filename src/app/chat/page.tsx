import { ChatWindow } from "@/components/ChatWindow";

const conversations = [
  { id: "c1", title: "Dubai Real Estate Campaign", updated: "5m ago" },
  { id: "c2", title: "Yesterday Lead Follow-ups", updated: "2h ago" },
  { id: "c3", title: "Budget Optimization Review", updated: "Yesterday" },
];

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          DAB AI
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Agent Chat Workspace
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Coordinate campaigns, automate follow-ups, and monitor spend in one
          thread.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <div className="rounded-2xl border border-white/10 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Conversation History
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="rounded-xl border border-white/10 bg-white/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <p className="text-sm text-slate-900 dark:text-slate-100">
                  {conversation.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Updated {conversation.updated}
                </p>
              </div>
            ))}
          </div>
        </div>
        <ChatWindow />
      </div>
    </div>
  );
}
