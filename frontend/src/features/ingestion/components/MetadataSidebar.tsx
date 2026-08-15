import { Hash, FileText, Tag, Layers, Calendar, Loader2, Download } from "lucide-react";
import { DocumentDetail, Chunk } from "../hooks/useDocumentDetail";
import { getStatusBadge } from "./SharedUI";
import { getDownloadUrl } from "@/lib/api";
import React from "react";

interface MetadataSidebarProps {
  doc: DocumentDetail | null | undefined;
  chunks: Chunk[];
  loadingDoc: boolean;
  loadingChunks: boolean;
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

export function MetadataSidebar({ doc, chunks, loadingDoc, loadingChunks }: MetadataSidebarProps) {
  const isDownloadable = Boolean(
    doc?.s3_key &&
      !["queued", "processing", "extracting text...", "chunking and saving..."].includes(doc.status)
  );

  return (
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
              value={(doc?.filename.split(".").pop()?.toUpperCase() || "N/A") + " Document"}
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
                loadingChunks ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                ) : (
                  String(chunks.length)
                )
              }
            />
            <MetadataRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Added"
              value={
                doc
                  ? new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"
              }
            />
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-4">
              <div>
                <span className="text-on-surface-variant font-label-md text-[11px] uppercase tracking-wider block mb-2">
                  Status
                </span>
                {doc && getStatusBadge(doc.status)}
              </div>

              {doc && (
                <div>
                  <span className="text-on-surface-variant font-label-md text-[11px] uppercase tracking-wider block mb-2">
                    Actions
                  </span>
                  {isDownloadable ? (
                    <a
                      href={getDownloadUrl(doc.id)}
                      download={doc.filename}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-surface-container-high/80 hover:bg-primary/20 border border-outline-variant/40 hover:border-primary/40 text-on-surface hover:text-primary transition-all duration-200 flex items-center justify-between group shadow-sm backdrop-blur-sm"
                      title={`Download ${doc.filename}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-1.5 rounded-lg bg-surface-variant group-hover:bg-primary/20 transition-colors shrink-0">
                          <Download className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="font-label-md text-label-md leading-tight text-white group-hover:text-primary transition-colors">
                            Download Original
                          </span>
                          <span
                            className="font-body-sm text-[11px] text-on-surface-variant truncate max-w-[140px]"
                            title={doc.filename}
                          >
                            {doc.filename}
                          </span>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 px-3.5 rounded-xl bg-surface-variant/20 border border-outline-variant/20 text-on-surface-variant/40 flex items-center justify-between cursor-not-allowed opacity-60"
                      title={
                        !doc.s3_key
                          ? "No original file found in storage"
                          : "File is currently being processed"
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-1.5 rounded-lg bg-surface-variant/40 shrink-0">
                          <Download className="w-4 h-4 text-on-surface-variant/40" />
                        </div>
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="font-label-md text-label-md leading-tight text-on-surface-variant/40">
                            Download Original
                          </span>
                          <span className="font-body-sm text-[11px] text-on-surface-variant/30 truncate max-w-[140px]">
                            {doc.filename}
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

