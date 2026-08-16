"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, ChevronDown, AlignLeft, Layers, AlertCircle } from "lucide-react";
import { getMatchCount } from "@/features/ingestion/utils/highlighting";
import { useDocumentDetail } from "@/features/ingestion/hooks/useDocumentDetail";
import { DocumentHeader } from "@/features/ingestion/components/DocumentHeader";
import { MetadataSidebar } from "@/features/ingestion/components/MetadataSidebar";
import { ExtractedTextTab } from "@/features/ingestion/components/ExtractedTextTab";
import { VectorChunksTab } from "@/features/ingestion/components/VectorChunksTab";
import { DocumentTagsModal } from "@/features/ingestion/components/DocumentTagsModal";
import { retryIngestion, fetchTags, updateDocumentTags } from "@/lib/api";
import { TagItem } from "@/types";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const [retrying, setRetrying] = useState(false);

  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    fetchTags().then(setAvailableTags).catch(console.error);
  }, []);

  const {
    doc,
    chunks,
    filteredChunks,
    loadingDoc,
    loadingChunks,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    expandedChunks,
    toggleChunkExpansion,
    viewMode,
    setViewMode,
    currentMatchIndex,
    setCurrentMatchIndex,
    caseSensitive,
    setCaseSensitive,
    useRegex,
    setUseRegex,
    scrollToMatch,
    mutateDoc,
    mutateChunks,
  } = useDocumentDetail(docId);

  const handleRetry = async () => {
    if (!docId) return;
    setRetrying(true);
    try {
      await retryIngestion(docId);
      await Promise.all([mutateDoc?.(), mutateChunks?.()]);
    } catch (err) {
      console.error("Failed to retry ingestion:", err);
      alert("Failed to retry ingestion: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setRetrying(false);
    }
  };

  const handleSaveDocTags = async (id: string, tagIds: string[]) => {
    setSavingTags(true);
    try {
      await updateDocumentTags(id, tagIds);
      await mutateDoc();
    } finally {
      setSavingTags(false);
    }
  };

  const rawMarkdown = doc?.extractedMarkdown || "";
  const totalMatches = getMatchCount(rawMarkdown, searchQuery, caseSensitive, useRegex);

  const handleNextRawMatch = () => {
    if (totalMatches === 0) return;
    const nextIdx = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(`raw-match-${nextIdx}`);
  };

  const handlePrevRawMatch = () => {
    if (totalMatches === 0) return;
    const prevIdx = (currentMatchIndex - 1 + totalMatches) % totalMatches;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(`raw-match-${prevIdx}`);
  };

  const handleNextChunkMatch = () => {
    if (filteredChunks.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % filteredChunks.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(`chunk-card-${nextIdx}`);
  };

  const handlePrevChunkMatch = () => {
    if (filteredChunks.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + filteredChunks.length) % filteredChunks.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(`chunk-card-${prevIdx}`);
  };

  if (error) {
    return (
      <main className="flex-grow p-md md:p-margin-desktop flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-500/70" />
        <p className="font-headline-md text-headline-md text-white">Document Not Found</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
        <button
          onClick={() => router.push("/ingest")}
          className="mt-4 px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors font-label-md text-label-md flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ingest
        </button>
      </main>
    );
  }

  return (
    <main className="flex-grow p-md md:p-margin-desktop flex flex-col gap-8 w-full max-w-[1400px] mx-auto my-8 relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px]" />
      </div>

      <DocumentHeader doc={doc} loadingDoc={loadingDoc} />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[580px]">
        <MetadataSidebar
          doc={doc}
          chunks={chunks}
          loadingDoc={loadingDoc}
          loadingChunks={loadingChunks}
          onRetry={handleRetry}
          retrying={retrying}
          onManageTags={() => setShowTagsModal(true)}
        />

        <div className="lg:col-span-9 flex flex-col gap-4 h-full min-h-0">
          {/* Tab bar + search */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-surface-container-high/60 border border-outline-variant/30 p-1.5 rounded-xl backdrop-blur-sm">
              <button
                id="extracted-text-tab"
                onClick={() => {
                  setActiveTab("extracted-text");
                  setSearchQuery("");
                }}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "extracted-text"
                    ? "bg-surface-variant text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <AlignLeft className="w-4 h-4" />
                Extracted Text
              </button>
              <button
                id="vector-chunks-tab"
                onClick={() => {
                  setActiveTab("vector-chunks");
                  setSearchQuery("");
                }}
                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "vector-chunks"
                    ? "bg-surface-variant text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Layers className="w-4 h-4" />
                Vector Chunks
                {!loadingChunks && chunks.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                    {chunks.length}
                  </span>
                )}
              </button>
            </div>
            <div className="relative flex items-center gap-2">
              <div className="relative w-72 flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                <input
                  id="doc-detail-search"
                  type="text"
                  placeholder={activeTab === "extracted-text" ? "Search text..." : "Search chunks..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-20 py-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/40 text-on-surface font-body-sm text-body-sm placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors backdrop-blur-sm"
                />
                <div className="absolute right-2 flex items-center gap-1 select-none">
                  <button
                    onClick={() => setCaseSensitive(!caseSensitive)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-code-md text-[10px] font-bold transition-all ${
                      caseSensitive
                        ? "bg-primary text-black"
                        : "text-on-surface-variant hover:text-white hover:bg-surface-variant/50"
                    }`}
                    title="Match Case (Aa)"
                  >
                    Aa
                  </button>
                  <button
                    onClick={() => setUseRegex(!useRegex)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-code-md text-[12px] font-bold transition-all ${
                      useRegex
                        ? "bg-primary text-black"
                        : "text-on-surface-variant hover:text-white hover:bg-surface-variant/50"
                    }`}
                    title="Use Regular Expression (.*)"
                  >
                    .*
                  </button>
                </div>
              </div>
              {searchQuery && (
                <div className="flex items-center bg-surface-variant/45 border border-outline-variant/30 rounded-xl px-2.5 py-1.5 gap-1.5 shrink-0 backdrop-blur-sm">
                  <span className="text-[11px] text-on-surface-variant font-medium select-none min-w-[45px] text-center">
                    {activeTab === "extracted-text"
                      ? `${totalMatches > 0 ? currentMatchIndex + 1 : 0} of ${totalMatches}`
                      : `${filteredChunks.length > 0 ? currentMatchIndex + 1 : 0} of ${filteredChunks.length}`}
                  </span>
                  <div className="w-px h-3 bg-outline-variant/40" />
                  <button
                    onClick={activeTab === "extracted-text" ? handlePrevRawMatch : handlePrevChunkMatch}
                    disabled={
                      activeTab === "extracted-text" ? totalMatches === 0 : filteredChunks.length === 0
                    }
                    className="text-on-surface-variant hover:text-white disabled:opacity-30 disabled:pointer-events-none p-0.5 rounded transition-colors"
                    title="Previous match"
                  >
                    <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  </button>
                  <button
                    onClick={activeTab === "extracted-text" ? handleNextRawMatch : handleNextChunkMatch}
                    disabled={
                      activeTab === "extracted-text" ? totalMatches === 0 : filteredChunks.length === 0
                    }
                    className="text-on-surface-variant hover:text-white disabled:opacity-30 disabled:pointer-events-none p-0.5 rounded transition-colors"
                    title="Next match"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeTab === "extracted-text" && (
            <ExtractedTextTab
              rawMarkdown={rawMarkdown}
              loadingDoc={loadingDoc}
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchQuery={searchQuery}
              totalMatches={totalMatches}
              caseSensitive={caseSensitive}
              useRegex={useRegex}
              currentMatchIndex={currentMatchIndex}
            />
          )}

          {activeTab === "vector-chunks" && (
            <VectorChunksTab
              chunks={chunks}
              filteredChunks={filteredChunks}
              loadingChunks={loadingChunks}
              searchQuery={searchQuery}
              expandedChunks={expandedChunks}
              toggleChunkExpansion={toggleChunkExpansion}
              caseSensitive={caseSensitive}
              useRegex={useRegex}
              currentMatchIndex={currentMatchIndex}
            />
          )}
        </div>
      </div>

      {/* Document OBAC Tags Modal */}
      <DocumentTagsModal
        isOpen={showTagsModal}
        docId={doc?.id || null}
        docFilename={doc?.filename || ""}
        currentTags={doc?.tags || []}
        availableTags={availableTags}
        saving={savingTags}
        onClose={() => setShowTagsModal(false)}
        onSave={handleSaveDocTags}
      />
    </main>
  );
}