"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Bot, ArrowUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  progress?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = (textareaRef.current.scrollHeight) + 'px';
      if (textareaRef.current.scrollHeight > 128) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const question = input.trim();
    setInput("");
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: question };
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMsg, { id: aiMsgId, role: "ai", content: "", progress: "Thinking..." }]);
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, thread_id: threadId }),
      });

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
          const lines = chunk.split('\n');
          
          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith('event: ')) {
               currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              
              if (currentEvent === 'thread' || currentEvent === 'metadata') {
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.thread_id) setThreadId(parsed.thread_id);
                  } catch (e) {}
              } 
              else if (currentEvent === 'progress') {
                 try {
                   const parsed = JSON.parse(dataStr);
                   if (parsed.step) {
                     currentProgress = "Running step: " + parsed.step + "...";
                   }
                 } catch (e) {
                   currentProgress = dataStr;
                 }
                 setMessages(prev => prev.map(msg => 
                  msg.id === aiMsgId ? { ...msg, progress: currentProgress } : msg
                 ));
              }
              else if (currentEvent === 'token') {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.token) {
                    currentAiContent += parsed.token;
                  }
                } catch (e) {
                  currentAiContent += dataStr;
                }
                
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMsgId ? { ...msg, content: currentAiContent, progress: undefined } : msg
                ));
              }
              else if (currentEvent === 'error') {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.message) {
                    currentAiContent += "\n\n**Error:** " + parsed.message;
                  }
                } catch (e) {
                  currentAiContent += "\n\n**Error:** " + dataStr;
                }
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMsgId ? { ...msg, content: currentAiContent, progress: undefined } : msg
                ));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, content: "Sorry, I encountered an error. Please try again.", progress: undefined } : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-max-width-chat glass-panel rounded-[2rem] p-6 md:p-10 flex flex-col gap-12 mt-4 shadow-2xl mb-32">
        {messages.length === 0 ? (
           <div className="text-center my-20">
              <h2 className="font-headline-lg text-headline-lg mb-2 text-white">How can I help you today?</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Ask a question based on your ingested documents.</p>
           </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'flex-col gap-3'}`}>
              {msg.role === 'user' ? (
                <div className="user-bubble rounded-2xl p-5 max-w-[85%] rounded-tr-sm">
                  <p className="font-body-md text-body-md leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center shrink-0 shadow-lg">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="surface-card rounded-2xl p-7 max-w-[85%] rounded-tl-sm w-full">
                    {msg.progress && (
                      <div className="flex items-center gap-2 mb-5 text-on-surface-variant font-label-md text-label-md bg-background/40 w-fit px-3 py-1.5 rounded-full border border-outline-variant">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm">{msg.progress}</span>
                      </div>
                    )}
                    {msg.content && (
                       <div className="font-body-md text-body-md text-on-surface space-y-5 leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#05040a]/80 prose-pre:border prose-pre:border-outline-variant max-w-none">
                         <ReactMarkdown>{msg.content}</ReactMarkdown>
                       </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 flex justify-center bg-gradient-to-t from-[#0d0a14] via-[#0d0a14]/90 to-transparent pb-10 z-40">
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
              style={{ overflowY: 'hidden' }}
              disabled={isStreaming}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="bg-gradient-to-br from-primary to-[#a78bfa] text-[#0d0a14] rounded-xl p-3 flex items-center justify-center shrink-0 mb-1 ml-2 hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
            >
               {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" strokeWidth={3} />}
            </button>
          </form>
          <div className="text-center mt-3 text-on-surface-variant/80 font-body-sm text-[13px] tracking-wide">
             RAG.ai can make mistakes. Check important info against sources.
          </div>
        </div>
      </div>
    </>
  );
}
