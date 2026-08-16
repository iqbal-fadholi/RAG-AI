"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui";

export function getStatusBadge(status: string) {
  switch (status) {
    case "queued":
      return <Badge variant="default" dot>Queued</Badge>;
    case "processing":
    case "extracting text...":
    case "chunking and saving...":
      return (
        <Badge variant="primary" dot dotPulse>
          {status.replace(/\.\.\.$/, "").replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      );
    case "pending_review":
    case "pending":
      return <Badge variant="warning" dot>Pending Review</Badge>;
    case "approved":
    case "done":
      return <Badge variant="success" dot>Processed</Badge>;
    case "error":
      return <Badge variant="danger" dot>Error</Badge>;
    default:
      return <Badge variant="default" dot>{status}</Badge>;
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
