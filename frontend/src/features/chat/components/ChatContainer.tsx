"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function ChatContainer() {
  return (
    <>
      <MessageList />
      <ChatInput />
    </>
  );
}
