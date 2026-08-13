"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Copy,
  Check,
  Search,
  Layers,
  AlignLeft,
  Tag,
  Calendar,
  Hash,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface DocumentDetail {
  id: string;
  filename: string;
  status: string;
  s3_key: string;
  uploaded_at: string;
  extractedMarkdown: string;
}

interface Chunk {
  id: string;
  page_content: string;
  metadata: Record<string, any>;
}

type ActiveTab = "extracted-text" | "vector-chunks";

function getStatusBadge(status: string) {
  switch (status) {
    case "queued":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-variant border border-outline-variant text-on-surface font-label-md text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50" />
          Queued
        </span>
      );
    case "processing":
    case "extracting text...":
    case "chunking and saving...":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-[12px] animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          {status.replace(/\.\.\.$/,"").replace(/\b\w/g,(l)=>l.toUpperCase())}
        </span>
      );
    case "pending_review":
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-label-md text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Pending Review
        </span>
      );
    case "approved":
    case "done":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-label-md text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Processed
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-label-md text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-variant border border-outline-variant text-on-surface font-label-md text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50" />
          {status}
        </span>
      );
  }
}

function MetadataRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-outline-variant/30 last:border-b-0">
      <span className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span
        className={`text-primary font-body-sm text-body-sm text-right max-w-[55%] break-all ${
          mono ? "font-code-md text-code-md text-[12px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CopyButton({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <button
      onClick={handleCopy}
      className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-surface-variant/60"
      title="Copy to clipboard"
    >
      {copied ? <Check className={`${iconSize} text-emerald-400`} /> : <Copy className={iconSize} />}
    </button>
  );
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [loadingChunks, setLoadingChunks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("extracted-text");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDoc = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/ingest/files/${docId}`);
      if (!res.ok) throw new Error("Document not found");
      const data = await res.json();
      setDoc(data);
    } catch (err: any) {
      setError(err.message || "Failed to load document");
    } finally {
      setLoadingDoc(false);
    }
  }, [docId]);

  const fetchChunks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/ingest/files/${docId}/chunks`);
      if (!res.ok) throw new Error("Failed to load chunks");
      const data = await res.json();
      setChunks(data);
    } catch {
      // Chunks may not exist yet
    } finally {
      setLoadingChunks(false);
    }
  }, [docId]);

  useEffect(() => {
    fetchDoc();
    fetchChunks();
  }, [fetchDoc, fetchChunks]);

  const fileExt = doc?.filename.split(".").pop()?.toUpperCase() || "N/A";

  const filteredMarkdown = searchQuery
    ? (doc?.extractedMarkdown || "")
        .split("\n")
        .filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase()))
        .join("\n")
    : doc?.extractedMarkdown || "";

  const filteredChunks = searchQuery
    ? chunks.filter((c) => c.page_content.toLowerCase().includes(searchQuery.toLowerCase()))
    : chunks;

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

      {/* Page header */}
      <header className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/ingest")}
            className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-variant/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {loadingDoc ? (
            <div className="h-9 w-64 rounded-lg bg-surface-variant/50 animate-pulse" />
          ) : (
            <h1 className="font-headline-lg text-headline-lg text-white truncate max-w-3xl" title={doc?.filename}>
              {doc?.filename}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-3 ml-11">
          {doc && getStatusBadge(doc.status)}
          {doc && (
            <span className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Added{" "}
              {new Date(doc.uploaded_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
      </header>

      {/* 12-col grid: 3 sidebar + 9 content */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[580px]">
        {/* Metadata sidebar */}
        <aside className="lg:col-span-3 flex flex-col h-full">
          <div
            className="glass-panel rounded-[1.5rem] p-6 flex flex-col h-full"
            style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(20,20,30,0.4) 100%)" }}
          >
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-4">
              Document Details
            </h2>
            {loadingDoc ? (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-surface-variant/30 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col flex-grow">
                <MetadataRow
                  icon={<Hash className="w-3.5 h-3.5" />}
                  label="Doc ID"
                  value={(doc?.id || "").substring(0, 8) + "..."}
                  mono
                />
                <MetadataRow
                  icon={<FileText className="w-3.5 h-3.5" />}
                  label="Type"
                  value={fileExt + " Document"}
                />
                <MetadataRow
                  icon={<Tag className="w-3.5 h-3.5" />}
                  label="S3 Key"
                  value={doc?.s3_key ? doc.s3_key.substring(0, 16) + "..." : "N/A"}
                  mono
                />
                <MetadataRow
                  icon={<Layers className="w-3.5 h-3.5" />}
                  label="Chunks"
                  value={
                    loadingChunks
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                      : String(chunks.length)
                  }
                />
                <MetadataRow
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Added"
                  value={
                    doc
                      ? new Date(doc.uploaded_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : "N/A"
                  }
                />
                <div className="mt-4 pt-4 border-t border-outline-variant/30">
                  <span className="text-on-surface-variant font-label-md text-[11px] uppercase tracking-wider block mb-2">
                    Status
                  </span>
                  {doc && getStatusBadge(doc.status)}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Tabbed content area */}
        <div className="lg:col-span-9 flex flex-col gap-4 h-full min-h-0">
          {/* Tab bar + search */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-surface-container-high/60 border border-outline-variant/30 p-1.5 rounded-xl backdrop-blur-sm">
              <button
                id="extracted-text-tab"
                onClick={() => { setActiveTab("extracted-text"); setSearchQuery(""); }}
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
                onClick={() => { setActiveTab("vector-chunks"); setSearchQuery(""); }}
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
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input
                id="doc-detail-search"
                type="text"
                placeholder={activeTab === "extracted-text" ? "Search in text..." : "Filter chunks..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/40 text-on-surface font-body-sm text-body-sm placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors backdrop-blur-sm"
              />
            </div>
          </div>

          {/* --- Extracted Text tab --- */}
          {activeTab === "extracted-text" && (
            <div className="glass-panel rounded-[1.5rem] flex flex-col flex-grow min-h-0 overflow-hidden border border-outline-variant/30">
              <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-4 bg-surface-container-high/30 backdrop-blur-sm shrink-0">
                <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" />
                  Raw Extraction (Markdown)
                  {searchQuery && (
                    <span className="ml-2 text-[11px] text-primary/70">
                      filtered by &quot;{searchQuery}&quot;
                    </span>
                  )}
                </span>
                <CopyButton text={doc?.extractedMarkdown || ""} />
              </div>
              <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar p-6">
                {loadingDoc ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                  </div>
                ) : !doc?.extractedMarkdown ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant">
                    <AlignLeft className="w-10 h-10 opacity-30" />
                    <p className="font-body-sm text-body-sm">No extracted text available yet.</p>
                    <p className="font-body-sm text-[12px] opacity-60">The document may still be processing.</p>
                  </div>
                ) : (
                  <pre className="font-code-md text-code-md text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words bg-black/20 p-4 rounded-xl">
                    {filteredMarkdown || (searchQuery ? "No matches found." : "")}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* --- Vector Chunks tab --- */}
          {activeTab === "vector-chunks" && (
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
                    return (
                      <div
                        key={chunk.id}
                        className="group bg-surface border border-outline-variant/50 rounded-xl p-4 hover:border-indigo-500/40 transition-all duration-200 cursor-default"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-label-md text-label-md text-primary group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                              Chunk #{chunkIndex}
                            </span>
                            {chunk.metadata?.filename && (
                              <span className="text-[11px] text-on-surface-variant/60 bg-surface-variant/40 px-2 py-0.5 rounded-md">
                                {chunk.metadata.filename}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-code-md text-[11px] text-on-surface-variant flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {charCount} chars
                            </span>
                            <CopyButton text={chunk.page_content} size="sm" />
                          </div>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                          {chunk.page_content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}