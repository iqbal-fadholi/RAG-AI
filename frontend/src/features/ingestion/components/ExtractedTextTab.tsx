"use client";

import ReactMarkdown from "react-markdown";
import { AlignLeft, Loader2 } from "lucide-react";
import { CopyButton } from "./SharedUI";
import { highlightNodes, highlightRawText } from "../utils/highlighting";
import { Card, EmptyState } from "@/components/ui";

interface ExtractedTextTabProps {
  rawMarkdown: string;
  loadingDoc: boolean;
  viewMode: "preview" | "raw";
  setViewMode: (mode: "preview" | "raw") => void;
  searchQuery: string;
  totalMatches: number;
  caseSensitive: boolean;
  useRegex: boolean;
  currentMatchIndex: number;
}

export function ExtractedTextTab({
  rawMarkdown,
  loadingDoc,
  viewMode,
  setViewMode,
  searchQuery,
  totalMatches,
  caseSensitive,
  useRegex,
  currentMatchIndex,
}: ExtractedTextTabProps) {
  return (
    <Card variant="flat" className="rounded-2xl flex flex-col flex-grow min-h-0 overflow-hidden">
      <Card.Header>
        <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2">
          <AlignLeft className="w-4 h-4" />
          {viewMode === "preview" ? "Markdown Preview" : "Raw Extraction (Markdown)"}
          {searchQuery && totalMatches > 0 && (
            <span className="ml-2 text-[11px] text-primary/70">
              found {totalMatches} matches
            </span>
          )}
        </span>

        <div className="flex items-center gap-4">
          <div className="flex bg-surface-variant/40 border border-outline-variant/30 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                viewMode === "preview"
                  ? "bg-primary text-black shadow-sm"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                viewMode === "raw"
                  ? "bg-primary text-black shadow-sm"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              Raw
            </button>
          </div>
          <CopyButton text={rawMarkdown} />
        </div>
      </Card.Header>
      <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar p-6">
        {loadingDoc ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : !rawMarkdown ? (
          <EmptyState
            icon={<AlignLeft className="w-8 h-8" />}
            title="No extracted text"
            description="The document may still be processing."
          />
        ) : viewMode === "preview" ? (
          <div className="bg-black/20 p-6 rounded-xl prose prose-invert max-w-none text-on-surface prose-headings:text-white prose-a:text-indigo-400 prose-strong:text-white prose-code:text-indigo-300 prose-pre:bg-black/30 font-body-sm text-body-sm leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p>{highlightNodes(children, searchQuery, caseSensitive, useRegex)}</p>,
                li: ({ children }) => <li>{highlightNodes(children, searchQuery, caseSensitive, useRegex)}</li>,
                h1: ({ children }) => <h1>{highlightNodes(children, searchQuery, caseSensitive, useRegex)}</h1>,
                h2: ({ children }) => <h2>{highlightNodes(children, searchQuery, caseSensitive, useRegex)}</h2>,
                h3: ({ children }) => <h3>{highlightNodes(children, searchQuery, caseSensitive, useRegex)}</h3>,
                h4: ({ children }) => <h4>{highlightNodes(children, searchQuery, caseSensitive, useRegex)}</h4>,
                h5: ({ children }) => <h5>{highlightNodes(children, searchQuery, caseSensitive, useRegex)}</h5>,
                h6: ({ children }) => <h6>{highlightNodes(children, searchQuery, caseSensitive, useRegex)}</h6>,
              }}
            >
              {rawMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          <pre className="font-code-md text-code-md text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words bg-black/20 p-4 rounded-xl">
            {highlightRawText(rawMarkdown, searchQuery, currentMatchIndex, caseSensitive, useRegex)}
          </pre>
        )}
      </div>
    </Card>
  );
}
