import { ChatWindow } from "@/components/ChatWindow";

export default function ChatPage() {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  );
}
