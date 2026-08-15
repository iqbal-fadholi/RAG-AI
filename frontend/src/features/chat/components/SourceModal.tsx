import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ExternalLink, X, Copy, Check, Sparkles } from "lucide-react";
import { SourceDocument } from "@/types";

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  fileId?: string | null;
  sources: SourceDocument[];
  initialFocusIndex?: number | null;
}

export function SourceModal({
  isOpen,
  onClose,
  filename,
  fileId,
  sources,
  initialFocusIndex,
}: SourceModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col surface-card glass-panel rounded-2xl border border-outline-variant shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-surface-variant border border-outline-variant flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-headline-md text-base text-white truncate font-semibold" title={filename}>
                {filename}
              </h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary/70" />
                {sources.length} {sources.length === 1 ? "cited excerpt" : "cited excerpts"} in response
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fileId && (
              <Link
                href={`/ingest/${fileId}`}
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/50 hover:bg-surface-variant border border-outline-variant text-xs text-on-surface hover:text-white transition-colors"
                title="Open Document Details"
              >
                <span>View Details</span>
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-background/40 hover:bg-surface-variant border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Excerpts List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {sources.map((src) => {
            const isTargeted = initialFocusIndex === src.index;
            return (
              <div
                key={src.index}
                id={`source-excerpt-${src.index}`}
                className={`rounded-xl border transition-all p-4 ${
                  isTargeted
                    ? "border-primary/60 bg-primary/[0.06] ring-1 ring-primary/40 shadow-lg"
                    : "border-outline-variant bg-[#090812]/70 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-primary/20 border border-primary/40 text-primary font-mono text-xs font-semibold">
                      [{src.index}]
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Context Excerpt {src.index}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(src.content, src.index)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-outline-variant text-xs text-on-surface-variant hover:text-white transition-colors"
                  >
                    {copiedIndex === src.index ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-lg bg-[#05040a]/90 p-3.5 border border-outline-variant font-body-sm text-sm text-[#e5e1e4] leading-relaxed whitespace-pre-wrap font-sans max-h-60 overflow-y-auto custom-scrollbar select-text">
                  {src.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-outline-variant bg-white/[0.01] flex items-center justify-between text-xs text-on-surface-variant">
          <span>Sources retrieved via hybrid semantic & keyword rank fusion</span>
          {fileId && (
            <Link
              href={`/ingest/${fileId}`}
              className="sm:hidden flex items-center gap-1 text-primary hover:underline"
            >
              <span>View Details</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
