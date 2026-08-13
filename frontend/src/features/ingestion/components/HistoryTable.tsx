import { useRouter } from "next/navigation";
import { Eye, Trash2, TableProperties, FileText } from "lucide-react";
import { deleteFile, getIngestionStatus } from "@/lib/api";
import { useIngestionStore } from "../store/useIngestionStore";
import { useDocuments } from "../hooks/useDocuments";

export function HistoryTable() {
  const router = useRouter();
  const { documents, mutate } = useDocuments();
  const { setStatus, setFile, setParsedDoc, setEditedMarkdown, parsedDoc } = useIngestionStore();

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document and its associated vector chunks?")) {
      return;
    }
    try {
      await deleteFile(docId);
      mutate();
      if (parsedDoc && parsedDoc.doc_id === docId) {
        setStatus('idle');
        setFile(null);
        setParsedDoc(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleResumeReview = async (docId: string, filename: string) => {
    setFile({ name: filename, size: 0 } as File);
    
    try {
      const data = await getIngestionStatus(docId);
      
      if (data.status === 'pending_review' || data.status === 'pending') {
        setParsedDoc({ doc_id: docId, markdown: data.extractedMarkdown, metadata: data.metadata });
        setEditedMarkdown(data.extractedMarkdown);
        setStatus('reviewing');
      } else {
        alert(`Document cannot be reviewed. Current status: ${data.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'xlsx') return <TableProperties className="w-5 h-5 text-primary/70" />;
    return <FileText className="w-5 h-5 text-primary/70" />;
  };

  const getStatusBadge = (docStatus: string) => {
    switch (docStatus) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-variant border border-outline-variant text-on-surface font-label-md text-[12px]">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50"></span>
            Queued
          </span>
        );
      case 'processing':
      case 'extracting text...':
      case 'chunking and saving...':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-[12px] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            {docStatus.replace(/\.\.\.$/, '').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        );
      case 'pending_review':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-label-md text-[12px]">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            Pending Review
          </span>
        );
      case 'approved':
      case 'done':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-label-md text-[12px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Done
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-label-md text-[12px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-variant border border-outline-variant text-on-surface font-label-md text-[12px]">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50"></span>
            {docStatus}
          </span>
        );
    }
  };

  return (
    <section className="w-full mt-8">
      <div className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-outline-variant bg-surface-container-high/30 flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md text-white">Ingested Documents History</h2>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-on-surface-variant font-label-md text-label-md">Live Updates</span>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-on-surface-variant font-label-md text-label-md border-b border-outline-variant">
                <th className="px-6 py-4 font-medium">Document Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date Added</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-sm text-on-surface">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    No uploaded documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-outline-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3 font-medium text-white truncate max-w-[250px]" title={doc.filename}>
                      {getFileIcon(doc.filename)}
                      {doc.filename}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {new Date(doc.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-medium">
                      {doc.filename.split('.').pop()?.toUpperCase() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => router.push(`/ingest/${doc.id}`)}
                          className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(doc.status === 'pending_review' || doc.status === 'pending') && (
                          <button
                            onClick={() => handleResumeReview(doc.id, doc.filename)}
                            className="px-3 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors font-label-md text-[12px]"
                          >
                            Review
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-on-surface-variant hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
