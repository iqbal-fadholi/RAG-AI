import { Layers, Loader2, ChevronRight, ChevronDown, Tag } from "lucide-react";
import { CopyButton } from "./SharedUI";
import { Chunk } from "../hooks/useDocumentDetail";
import { highlightChunkText } from "../utils/highlighting";

interface VectorChunksTabProps {
  chunks: Chunk[];
  filteredChunks: Chunk[];
  loadingChunks: boolean;
  searchQuery: string;
  expandedChunks: Set<string>;
  toggleChunkExpansion: (id: string) => void;
  caseSensitive: boolean;
  useRegex: boolean;
  currentMatchIndex: number;
}

export function VectorChunksTab({
  chunks,
  filteredChunks,
  loadingChunks,
  searchQuery,
  expandedChunks,
  toggleChunkExpansion,
  caseSensitive,
  useRegex,
  currentMatchIndex,
}: VectorChunksTabProps) {
  return (
    <div className="glass-panel rounded-[1.5rem] flex flex-col flex-grow min-h-0 overflow-hidden border border-outline-variant/30">
      <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-4 bg-surface-container-high/30 backdrop-blur-sm shrink-0">
        <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Vector Chunks
          {!loadingChunks && (
            <span className="ml-1 text-primary font-medium">
              ({filteredChunks.length}
              {searchQuery && chunks.length !== filteredChunks.length ? ` of ${chunks.length}` : ""})
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-on-surface-variant bg-surface-variant/50 px-2 py-1 rounded-md border border-outline-variant/30">
            Size: 1500
          </span>
          <span className="text-[11px] text-on-surface-variant bg-surface-variant/50 px-2 py-1 rounded-md border border-outline-variant/30">
            Overlap: 200
          </span>
        </div>
      </div>
      <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {loadingChunks ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : filteredChunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant">
            <Layers className="w-10 h-10 opacity-30" />
            <p className="font-body-sm text-body-sm">
              {searchQuery
                ? "No chunks match your search."
                : "No chunks found. The document may not be fully processed yet."}
            </p>
          </div>
        ) : (
          filteredChunks.map((chunk, idx) => {
            const chunkIndex =
              chunk.metadata?.chunk_index !== undefined
                ? Number(chunk.metadata.chunk_index) + 1
                : idx + 1;
            const charCount = chunk.page_content.length;
            const isExpanded = expandedChunks.has(chunk.id);
            const needsExpansion = chunk.page_content.length > 300;
            const isMatchedAndActive = searchQuery && idx === currentMatchIndex;

            return (
              <div
                key={chunk.id}
                id={`chunk-card-${idx}`}
                className={`group bg-surface border rounded-xl p-4 transition-all duration-200 cursor-default ${
                  isMatchedAndActive
                    ? "border-transparent ring-2 ring-primary shadow-lg shadow-primary/10"
                    : "border-outline-variant/50 hover:border-indigo-500/40"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md text-primary group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                      Chunk #{chunkIndex}
                    </span>
                    {chunk.metadata?.filename ? (
                      <span className="text-[11px] text-on-surface-variant/60 bg-surface-variant/40 px-2 py-0.5 rounded-md">
                        {String(chunk.metadata.filename)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-code-md text-[11px] text-on-surface-variant flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {charCount} chars
                    </span>
                    <CopyButton text={chunk.page_content} size="sm" />
                  </div>
                </div>
                <div className="relative">
                  <p
                    className={`font-body-sm text-body-sm text-on-surface-variant leading-relaxed transition-all duration-300 ${
                      isExpanded ? "" : "line-clamp-3"
                    }`}
                  >
                    {highlightChunkText(chunk.page_content, searchQuery, caseSensitive, useRegex)}
                  </p>
                  {!isExpanded && needsExpansion && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
                  )}
                </div>
                {needsExpansion && (
                  <button
                    onClick={() => toggleChunkExpansion(chunk.id)}
                    className="mt-2 flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary font-medium transition-colors"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
