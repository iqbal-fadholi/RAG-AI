import { Loader2, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, progress } = message;

  return (
    <div className={`flex w-full ${role === 'user' ? 'justify-end' : 'flex-col gap-3'}`}>
      {role === 'user' ? (
        <div className="user-bubble rounded-2xl p-5 max-w-[85%] rounded-tr-sm">
          <p className="font-body-md text-body-md leading-relaxed">{content}</p>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center shrink-0 shadow-lg">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="surface-card rounded-2xl p-7 max-w-[85%] rounded-tl-sm w-full">
            {progress && (
              <div className="flex items-center gap-2 mb-5 text-on-surface-variant font-label-md text-label-md bg-background/40 w-fit px-3 py-1.5 rounded-full border border-outline-variant">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">{progress}</span>
              </div>
            )}
            {content && (
              <div className="font-body-md text-body-md text-on-surface space-y-5 leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#05040a]/80 prose-pre:border prose-pre:border-outline-variant max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
