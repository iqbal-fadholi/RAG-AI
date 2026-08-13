import ReactMarkdown from "react-markdown";
import { AlignLeft, Loader2 } from "lucide-react";
import { CopyButton } from "./SharedUI";
import { highlightNodes, highlightRawText } from "../utils/highlighting";

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
    <div className="glass-panel rounded-[1.5rem] flex flex-col flex-grow min-h-0 overflow-hidden border border-outline-variant/30">
      <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-4 bg-surface-container-high/30 backdrop-blur-sm shrink-0">
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
      </div>
      <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar p-6">
        {loadingDoc ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : !rawMarkdown ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant">
            <AlignLeft className="w-10 h-10 opacity-30" />
            <p className="font-body-sm text-body-sm">No extracted text available yet.</p>
            <p className="font-body-sm text-[12px] opacity-60">
              The document may still be processing.
            </p>
          </div>
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
    </div>
  );
}
