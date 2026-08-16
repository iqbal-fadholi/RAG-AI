"use client";

import { ArrowLeft, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { getStatusBadge } from "./SharedUI";
import { DocumentDetail } from "../hooks/useDocumentDetail";

interface DocumentHeaderProps {
  doc: DocumentDetail | null | undefined;
  loadingDoc: boolean;
}

export function DocumentHeader({ doc, loadingDoc }: DocumentHeaderProps) {
  const router = useRouter();

  return (
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
            {new Date(doc.uploaded_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </header>
  );
}
