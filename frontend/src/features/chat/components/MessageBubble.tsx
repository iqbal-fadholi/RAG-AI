import React, { useState, useCallback } from "react";
import { Loader2, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage, SourceDocument } from "@/types";
import { SourceList, GroupedSource } from "./SourceList";
import { SourceModal } from "./SourceModal";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, progress, sources } = message;

  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    filename: string;
    fileId?: string | null;
    sources: SourceDocument[];
    initialFocusIndex?: number | null;
  }>({
    isOpen: false,
    filename: "",
    fileId: null,
    sources: [],
    initialFocusIndex: null,
  });

  const handleCitationClick = useCallback(
    (citationIndex: number) => {
      if (!sources || sources.length === 0) return;

      const targetSource = sources.find((s) => s.index === citationIndex);
      if (!targetSource) return;

      // Group all sources from the same document
      const docSources = sources.filter(
        (s) =>
          (targetSource.fileId && s.fileId === targetSource.fileId) ||
          (!targetSource.fileId && s.filename === targetSource.filename)
      );

      setActiveModal({
        isOpen: true,
        filename: targetSource.filename,
        fileId: targetSource.fileId,
        sources: docSources.length > 0 ? docSources : [targetSource],
        initialFocusIndex: citationIndex,
      });
    },
    [sources]
  );

  const handleSelectGroup = useCallback((group: GroupedSource) => {
    setActiveModal({
      isOpen: true,
      filename: group.filename,
      fileId: group.fileId,
      sources: group.sources,
      initialFocusIndex: null,
    });
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Helper to convert citation patterns like [1], [2] into interactive buttons
  const renderWithCitations = useCallback(
    (text: string): React.ReactNode => {
      if (typeof text !== "string") return text;
      const citationRegex = /\[(\d+)\]/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = citationRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index));
        }
        const citationIndex = parseInt(match[1], 10);
        const hasSource = sources?.some((s) => s.index === citationIndex);

        parts.push(
          <button
            key={`cite-${match.index}-${citationIndex}`}
            type="button"
            onClick={() => handleCitationClick(citationIndex)}
            disabled={!hasSource}
            className={`inline-flex items-center justify-center px-1.5 py-0.2 mx-0.5 text-xs font-mono font-semibold rounded cursor-pointer transition-all active:scale-95 align-baseline ${
              hasSource
                ? "text-primary bg-primary/10 hover:bg-primary/25 border border-primary/30 hover:border-primary/60 shadow-sm"
                : "text-on-surface-variant bg-white/5 border border-outline-variant cursor-default"
            }`}
            title={hasSource ? `View Source [${citationIndex}]` : `Source [${citationIndex}]`}
          >
            [{citationIndex}]
          </button>
        );
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    },
    [handleCitationClick, sources]
  );

  const processCitationNodes = useCallback(
    (nodes: React.ReactNode): React.ReactNode => {
      return React.Children.map(nodes, (child) => {
        if (typeof child === "string") {
          return renderWithCitations(child);
        }
        if (React.isValidElement(child) && (child.props as any)?.children) {
          return React.cloneElement(child, {
            ...(child.props as any),
            children: processCitationNodes((child.props as any).children),
          });
        }
        return child;
      });
    },
    [renderWithCitations]
  );

  return (
    <div className={`flex w-full ${role === "user" ? "justify-end" : "flex-col gap-3"}`}>
      {role === "user" ? (
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
              <div className="font-body-md text-body-md text-on-surface space-y-4 leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#05040a]/80 prose-pre:border prose-pre:border-outline-variant max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{processCitationNodes(children)}</p>,
                    li: ({ children }) => <li className="leading-relaxed">{processCitationNodes(children)}</li>,
                    strong: ({ children }) => <strong>{processCitationNodes(children)}</strong>,
                    em: ({ children }) => <em>{processCitationNodes(children)}</em>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}

            {/* Sources section */}
            {sources && sources.length > 0 && (
              <SourceList sources={sources} onSelectGroup={handleSelectGroup} />
            )}
          </div>
        </div>
      )}

      {/* Source Modal */}
      <SourceModal
        isOpen={activeModal.isOpen}
        onClose={closeModal}
        filename={activeModal.filename}
        fileId={activeModal.fileId}
        sources={activeModal.sources}
        initialFocusIndex={activeModal.initialFocusIndex}
      />
    </div>
  );
}
