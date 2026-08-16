import { useState, useEffect } from "react";
import { getIngestionStatus, editMarkdown, approveIngestion } from "@/lib/api";
import { Check, Edit3, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Modal, Button } from "@/components/ui";

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
    <Modal open={!!threadId} onClose={onClose} maxWidth="4xl">
      <Modal.Header onClose={onClose}>
        <Edit3 className="w-5 h-5 text-primary" />
        Review Extracted Content
      </Modal.Header>
      
      <Modal.Body className="bg-[#05040a]/50 relative min-h-[50vh]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant bg-[#05040a]/80 z-10 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
            <p className="font-medium animate-pulse">Docling is processing the document...</p>
          </div>
        ) : editing ? (
          <textarea 
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-full min-h-[50vh] bg-transparent text-on-surface outline-none resize-none custom-scrollbar p-2 font-code-md text-code-md leading-relaxed"
            placeholder="Edit your markdown here..."
          />
        ) : (
          <div className="prose prose-invert max-w-none prose-pre:bg-black/30 prose-pre:border prose-pre:border-outline-variant">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="justify-between">
        <Button
          variant="ghost"
          onClick={() => setEditing(!editing)}
          disabled={loading}
        >
          {editing ? "Preview Mode" : "Edit Markdown"}
        </Button>
        <Button
          variant="primary"
          icon={!saving ? <Check className="w-4 h-4" /> : undefined}
          onClick={handleApprove}
          loading={saving}
          disabled={loading}
        >
          {saving ? "Saving..." : "Approve & Ingest"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
