"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { useChatStore } from "../store/useChatStore";
import { Loader2, Sparkles } from "lucide-react";

export function MessageList() {
  const { messages, isLoadingHistory } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoadingHistory]);

  return (
    <div className="w-full max-w-max-width-chat glass-panel rounded-[2rem] p-6 md:p-10 flex flex-col gap-12 mt-4 shadow-2xl mb-32">
      {isLoadingHistory ? (
        <div className="flex flex-col items-center justify-center my-24 gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-white/90">Loading conversation history...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center my-20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-lg text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-headline-lg text-headline-lg mb-2 text-white">
            How can I help you today?
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            Ask questions, analyze concepts, or synthesize insights from your ingested documents.
          </p>
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
