import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { useChatStore } from "../store/useChatStore";

export function MessageList() {
  const { messages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="w-full max-w-max-width-chat glass-panel rounded-[2rem] p-6 md:p-10 flex flex-col gap-12 mt-4 shadow-2xl mb-32">
      {messages.length === 0 ? (
        <div className="text-center my-20">
          <h2 className="font-headline-lg text-headline-lg mb-2 text-white">How can I help you today?</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Ask a question based on your ingested documents.</p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
