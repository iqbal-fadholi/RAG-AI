"use client";

import React, { useEffect } from "react";
import { ChatContainer } from "@/features/chat/components/ChatContainer";
import { useChatStore } from "@/features/chat/store/useChatStore";

export default function ChatPage() {
  const { threadId, startNewChat } = useChatStore();

  // If user visits /chat directly while a previous thread is still set, reset to fresh chat
  useEffect(() => {
    if (threadId) {
      startNewChat();
    }
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center w-full">
      <ChatContainer />
    </main>
  );
}
