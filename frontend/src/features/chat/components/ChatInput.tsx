"use client";

import { useRef } from "react";
import { Loader2, ArrowUp } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { ChatMessage } from "@/types";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function ChatInput() {
  const {
    input,
    setInput,
    isStreaming,
    setIsStreaming,
    setMessages,
    threadId,
    setThreadId,
    isSidebarOpen,
    loadConversations,
  } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      if (textareaRef.current.scrollHeight > 128) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) return;

    const question = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };
    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: aiMsgId, role: "ai", content: "", progress: "Thinking..." },
    ]);
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          question,
          ...(threadId ? { thread_id: threadId } : {}),
        }),
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          window.location.href = "/login";
        }
        throw new Error("Authentication required");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let currentAiContent = "";
      let currentProgress = "Processing query...";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);

              if (currentEvent === "thread") {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.thread_id) {
                    setThreadId(parsed.thread_id);
                    if (typeof window !== "undefined" && !window.location.pathname.includes(parsed.thread_id)) {
                      window.history.replaceState(null, "", `/chat/${parsed.thread_id}`);
                    }
                  }
                } catch {}
              } else if (currentEvent === "metadata") {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.thread_id) {
                    setThreadId(parsed.thread_id);
                    if (typeof window !== "undefined" && !window.location.pathname.includes(parsed.thread_id)) {
                      window.history.replaceState(null, "", `/chat/${parsed.thread_id}`);
                    }
                  }
                  if (parsed.sources && Array.isArray(parsed.sources)) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMsgId
                          ? { ...msg, sources: parsed.sources }
                          : msg
                      )
                    );
                  }
                } catch {}
              } else if (currentEvent === "progress") {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.step) {
                    currentProgress = "Running step: " + parsed.step + "...";
                  }
                } catch {
                  currentProgress = dataStr;
                }
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, progress: currentProgress }
                      : msg
                  )
                );
              } else if (currentEvent === "token") {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.token) {
                    currentAiContent += parsed.token;
                  }
                } catch {
                  currentAiContent += dataStr;
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                          ...msg,
                          content: currentAiContent,
                          progress: undefined,
                        }
                      : msg
                  )
                );
              } else if (currentEvent === "error") {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.message) {
                    currentAiContent += "\n\n**Error:** " + parsed.message;
                  }
                } catch {
                  currentAiContent += "\n\n**Error:** " + dataStr;
                }
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                          ...msg,
                          content: currentAiContent,
                          progress: undefined,
                        }
                      : msg
                  )
                );
              }
            }
          }
        }
      }

      // Stream completed - refresh conversation list in background
      loadConversations();
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content:
                  "Sorry, I encountered an error. Please try again.",
                progress: undefined,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div
      className={`fixed bottom-0 right-0 left-0 ${
        isSidebarOpen ? "md:left-80" : "md:left-0"
      } p-6 flex justify-center bg-gradient-to-t from-[#0d0a14] via-[#0d0a14]/90 to-transparent pb-10 z-30 transition-all duration-300 ease-in-out`}
    >
      <div className="w-full max-w-max-width-chat relative">
        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-[1.5rem] flex items-end p-2.5 border border-white/20 focus-within:border-primary/50 transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents..."
            className="w-full bg-transparent border-none text-white font-body-md text-body-md placeholder:text-on-surface-variant outline-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3.5 px-4 custom-scrollbar"
            rows={1}
            style={{ overflowY: "hidden" }}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="bg-gradient-to-br from-primary to-[#a78bfa] text-[#0d0a14] rounded-xl p-3 flex items-center justify-center shrink-0 mb-1 ml-2 hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" strokeWidth={3} />
            )}
          </button>
        </form>
        <div className="text-center mt-3 text-on-surface-variant/80 font-body-sm text-[13px] tracking-wide">
          RAG.ai can make mistakes. Check important info against sources.
        </div>
      </div>
    </div>
  );
}
