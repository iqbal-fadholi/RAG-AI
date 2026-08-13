import { Hash, FileText, Tag, Layers, Calendar, Loader2 } from "lucide-react";
import { DocumentDetail, Chunk } from "../hooks/useDocumentDetail";
import { getStatusBadge } from "./SharedUI";
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
  );
}
