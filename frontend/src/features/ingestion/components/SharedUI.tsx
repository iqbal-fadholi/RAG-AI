import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function getStatusBadge(status: string) {
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
          {status.replace(/\.\.\.$/, "").replace(/\b\w/g, (l) => l.toUpperCase())}
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

export function CopyButton({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
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
