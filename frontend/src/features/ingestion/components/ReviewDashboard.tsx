import { FileText, CheckCircle, Edit2, Code, AlignLeft, Copy } from "lucide-react";
import { useIngestionStore } from "../store/useIngestionStore";
import { editMarkdown, approveIngestion } from "@/lib/api";
import { useDocuments } from "../hooks/useDocuments";

export function ReviewDashboard() {
  const { status, setStatus, file, parsedDoc, editedMarkdown, setEditedMarkdown, setFile, setParsedDoc } = useIngestionStore();
  const { mutate } = useDocuments();

  if (status !== 'reviewing' && status !== 'approving') return null;
  if (!parsedDoc || !file) return null;

  const handleSaveEdits = async () => {
    setStatus('approving');
    try {
      await editMarkdown(parsedDoc.doc_id, editedMarkdown);
      setStatus('reviewing');
    } catch (error) {
      console.error(error);
      setStatus('reviewing');
    }
  };

  const handleApprove = async () => {
    setStatus('approving');
    try {
      await approveIngestion(parsedDoc.doc_id);
      setStatus('idle');
      setFile(null);
      setParsedDoc(null);
      mutate();
    } catch (error) {
      console.error(error);
      setStatus('reviewing');
    }
  };

  return (
    <section className="w-full flex flex-col lg:flex-row gap-8 h-[600px]">
      {/* Left Side: File Details */}
      <div className="w-full lg:w-[30%] flex flex-col gap-md">
        <div className="glass-panel rounded-[2rem] p-8 flex flex-col h-full shadow-2xl">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-6">File Details</h2>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-outline-variant">
            <FileText className="text-primary w-8 h-8 shrink-0" />
            <div className="flex-grow overflow-hidden">
              <h3 className="font-body-md text-body-md truncate text-white font-medium" title={file.name}>{file.name}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{(file.size / (1024 * 1024)).toFixed(1)} MB • {file.name.split('.').pop()?.toUpperCase()}</p>
            </div>
          </div>
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-variant text-on-surface-variant font-label-md text-[12px] border border-outline-variant">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Pending Review
            </span>
          </div>
          
          <div className="flex-grow">
            <h4 className="font-label-md text-label-md text-on-surface-variant mb-4">Extracted Metadata</h4>
            <ul className="space-y-4 text-body-sm text-on-surface">
              <li className="flex justify-between border-b border-outline-variant/30 pb-2">
                <span className="text-on-surface-variant">Doc ID</span>
                <span className="font-medium font-code-md truncate ml-4">{parsedDoc.doc_id.substring(0,8)}...</span>
              </li>
              <li className="flex justify-between border-b border-outline-variant/30 pb-2">
                <span className="text-on-surface-variant">Chunks</span>
                <span className="font-medium">{parsedDoc.metadata?.chunk_count || 'N/A'}</span>
              </li>
            </ul>
          </div>

          <div className="mt-auto pt-6 border-t border-outline-variant flex flex-col gap-4">
            <button 
              onClick={() => setStatus('idle')}
              className="w-full py-3 px-4 rounded-xl border border-outline-variant font-label-md text-label-md transition-colors flex justify-center items-center gap-2 hover:bg-surface-variant text-on-surface-variant"
            >
              Close Review
            </button>
            <button 
              onClick={handleSaveEdits}
              disabled={status === 'approving'}
              className="w-full py-3 px-4 rounded-xl action-button-secondary font-label-md text-label-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Edit2 className="w-4 h-4" />
              Save Edits
            </button>
            <button 
              onClick={handleApprove}
              disabled={status === 'approving'}
              className="w-full py-3 px-4 rounded-xl action-button-primary font-label-md text-label-md transition-opacity hover:opacity-90 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {status === 'approving' ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircle className="w-4 h-4" />}
              Approve & Process
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Markdown Editor */}
      <div className="w-full lg:w-[70%] glass-panel rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border border-outline-variant">
        <div className="bg-surface-container-high/50 border-b border-outline-variant px-6 py-4 flex justify-between items-center backdrop-blur-md">
          <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2">
            <Code className="w-4 h-4" />
            Extracted Content (Markdown)
          </span>
          <div className="flex gap-2">
            <button className="text-on-surface-variant hover:text-white p-2 rounded-lg hover:bg-surface-variant transition-colors" title="Format">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button 
               onClick={() => navigator.clipboard.writeText(editedMarkdown)}
               className="text-on-surface-variant hover:text-white p-2 rounded-lg hover:bg-surface-variant transition-colors" title="Copy">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <textarea 
          className="w-full h-full flex-grow bg-transparent p-8 font-code-md text-code-md text-on-surface resize-none focus:outline-none focus:ring-0 border-none leading-relaxed custom-scrollbar" 
          spellCheck="false"
          value={editedMarkdown}
          onChange={(e) => setEditedMarkdown(e.target.value)}
        />
      </div>
    </section>
  );
}
