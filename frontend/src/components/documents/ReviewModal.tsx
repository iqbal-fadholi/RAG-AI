import { useState, useEffect } from "react";
import { getIngestionStatus, editMarkdown, approveIngestion } from "@/lib/api";
import { Check, Edit3, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ReviewModalProps {
  threadId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ threadId, onClose, onSuccess }: ReviewModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    
    // Poll for status until the state is 'interrupted' or we get markdown
    const interval = setInterval(async () => {
      try {
        const data = await getIngestionStatus(threadId);
        setStatus(data);
        if (data.markdown) {
          setMarkdown(data.markdown);
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [threadId]);

  if (!threadId) return null;

  const handleApprove = async () => {
    setSaving(true);
    try {
      if (editing) {
        await editMarkdown(threadId, markdown);
      }
      await approveIngestion(threadId);
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            Review Extracted Content
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-neutral-950 custom-scrollbar relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 bg-neutral-950/80 z-10 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
              <p className="font-medium animate-pulse">Docling is processing the document...</p>
            </div>
          ) : editing ? (
            <textarea 
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-full min-h-[50vh] bg-transparent text-neutral-300 outline-none resize-none custom-scrollbar p-2 font-mono text-sm leading-relaxed"
              placeholder="Edit your markdown here..."
            />
          ) : (
            <div className="prose prose-invert prose-indigo max-w-none prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
          <button 
            onClick={() => setEditing(!editing)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {editing ? "Preview Mode" : "Edit Markdown"}
          </button>
          <button 
            onClick={handleApprove}
            disabled={saving || loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving..." : "Approve & Ingest"}
          </button>
        </div>
      </div>
    </div>
  );
}
