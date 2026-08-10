import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <main className="flex-1 flex flex-col items-center w-full py-10 px-margin-mobile md:px-4">
      <ChatInterface />
    </main>
  );
}
