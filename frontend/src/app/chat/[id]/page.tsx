"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatContainer } from "@/features/chat/components/ChatContainer";
import { useChatStore } from "@/features/chat/store/useChatStore";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { loadConversationById, threadId } = useChatStore();

  useEffect(() => {
    if (id && id !== threadId) {
      loadConversationById(id).then((success) => {
        if (!success) {
          router.replace("/chat");
        }
      });
    }
  }, [id, threadId, loadConversationById, router]);

  return (
    <main className="flex-1 flex flex-col items-center w-full">
      <ChatContainer />
    </main>
  );
}
