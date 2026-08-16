"use client";

import React from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { useChatStore } from "../store/useChatStore";

export function ChatContainer() {
  const { isSidebarOpen } = useChatStore();

  return (
    <div className="flex w-full min-h-[calc(100vh-5rem)] relative">
      {/* Collapsible History Sidebar */}
      <ChatSidebar />

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col items-center w-full py-6 px-4 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:pl-80" : "md:pl-0"
        }`}
      >
        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
}
