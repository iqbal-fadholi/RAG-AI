"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, CheckCircle, Edit2, Code, AlignLeft, Copy, TableProperties, UploadCloud, Trash2 } from "lucide-react";

type DocStatus = 'idle' | 'uploading' | 'processing' | 'reviewing' | 'approving' | 'done';

interface ParsedDoc {
  doc_id: string;
  markdown: string;
  metadata?: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function IngestionDashboard() {
  const [status, setStatus] = useState<DocStatus>('idle');
  const [detailedStatus, setDetailedStatus] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDoc | null>(null);
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/ingest/files`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStatus('uploading');
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      try {
        const res = await fetch(`${API_URL}/ingest/start`, {
          method: "POST",
          body: formData
        });
        if (!res.ok) {
          throw new Error(`Failed: ${res.status}`);
        }
        const data = await res.json();
        
        setStatus('processing');
        fetchHistory();
        pollStatus(data.thread_id);
      } catch (error) {
        console.error(error);
        setStatus('idle');
      }
    }
  };

  const pollStatus = async (docId: string) => {
    try {
      const res = await fetch(`${API_URL}/ingest/status/${docId}`);
      if (!res.ok) throw new Error('Status fetch failed');
      const data = await res.json();
      
      setDetailedStatus(data.status);
      
      if (data.status === 'pending_review') {
        setParsedDoc({ doc_id: docId, markdown: data.extractedMarkdown, metadata: data.metadata });
        setEditedMarkdown(data.extractedMarkdown);
        setStatus('reviewing');
        fetchHistory();
      } else if (data.status === 'done' || data.status === 'approved') {
        setStatus('done');
        fetchHistory();
      } else if (data.status === 'error') {
        setStatus('idle');
        fetchHistory();
      } else {
        fetchHistory();
        setTimeout(() => pollStatus(docId), 2000);
      }
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  const handleSaveEdits = async () => {
    if (!parsedDoc) return;
    setStatus('approving');
    try {
      const res = await fetch(`${API_URL}/ingest/edit/${parsedDoc.doc_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: editedMarkdown })
      });
      if (!res.ok) throw new Error("Save edits failed");
      setStatus('reviewing');
      fetchHistory();
    } catch (error) {
      console.error(error);
      setStatus('reviewing');
    }
  };

  const handleApprove = async () => {
    if (!parsedDoc) return;
    setStatus('approving');
    try {
      const res = await fetch(`${API_URL}/ingest/approve/${parsedDoc.doc_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Approve failed");
      setStatus('done');
      fetchHistory();
      // Reset after a moment
      setTimeout(() => {
        setStatus('idle');
        setFile(null);
        setParsedDoc(null);
      }, 2000);
    } catch (error) {
      console.error(error);
      setStatus('reviewing');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document and its associated vector chunks?")) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/ingest/files/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchHistory();
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
    setStatus('processing');
    setDetailedStatus('Resuming review...');
    pollStatus(docId);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'xlsx') return <TableProperties className="w-5 h-5 text-primary/70" />;
    return <FileText className="w-5 h-5 text-primary/70" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-variant border border-outline-variant text-on-surface font-label-md text-[12px]">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50"></span>
            Queued
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-[12px] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            Processing
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
            Approved
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
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-12">
      {/* Step 1: Upload Zone */}
      {(status === 'idle' || status === 'uploading' || status === 'processing' || status === 'done') && (
        <section className="w-full mb-xl">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".pdf,.docx,.txt,.md" 
          />
          <div 
            className={`glass-panel border-dashed rounded-[2rem] p-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-64 ${status === 'uploading' || status === 'processing' ? 'opacity-50 pointer-events-none' : 'hover:border-outline'}`}
            onClick={() => status === 'idle' && fileInputRef.current?.click()}
          >
             {status === 'done' ? (
                <>
                  <CheckCircle className="w-12 h-12 text-primary mb-sm" />
                  <p className="font-label-md text-label-md text-on-surface mb-xs">Document Ingested Successfully!</p>
                </>
             ) : status === 'processing' ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-sm"></div>
                  <p className="font-label-md text-label-md text-on-surface mb-xs">Processing Document...</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant capitalize">{detailedStatus || 'Queued in background worker...'}</p>
                </>
             ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-on-surface-variant mb-sm" />
                  <p className="font-label-md text-label-md text-on-surface mb-xs">Drag and drop your file here</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Supports PDF, DOCX, TXT, MD (Max 50MB)</p>
                  <button className="mt-md action-button-primary px-6 py-2 rounded-xl font-label-md text-label-md transition-opacity hover:opacity-90">
                    Select File
                  </button>
                </>
             )}
          </div>
        </section>
      )}

      {/* Step 2: Review Dashboard */}
      {(status === 'reviewing' || status === 'approving') && parsedDoc && file && (
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
      )}

      {/* History Table (Mock data for UI matching) */}
      <section className="w-full mt-8">
        <div className="glass-panel rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-outline-variant bg-surface-container-high/30">
            <h2 className="font-headline-md text-headline-md text-white">Ingested Documents History</h2>
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
    </div>
  );
}
