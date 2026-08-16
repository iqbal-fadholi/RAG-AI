"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, UploadCloud, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { fetchFiles, uploadFile, deleteFile } from "@/lib/api";
import { DocumentData } from "@/types";
import { ReviewModal } from "./ReviewModal";

export function DocumentManager() {
  const [files, setFiles] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reviewThreadId, setReviewThreadId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const data = await fetchFiles();
      setFiles(Array.isArray(data) ? data : (data as { files?: DocumentData[] })?.files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    loadFiles();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadFile(file);
      if (res.thread_id) {
        setReviewThreadId(res.thread_id);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await deleteFile(id);
      loadFiles();
    } catch (err) {
      console.error(err);
      alert("Failed to delete file");
    }
  };

  const handleReviewSuccess = () => {
    setReviewThreadId(null);
    loadFiles();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 px-1">Upload Knowledge</h2>
        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-neutral-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-neutral-900/50 hover:border-indigo-500/30'}`}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".pdf,.txt,.md"
          />
          <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mb-3 group-hover:-translate-y-1 transition-transform shadow-inner border border-neutral-800">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <p className="text-sm font-medium text-neutral-200">
            {uploading ? "Uploading..." : "Click to upload"}
          </p>
          <p className="text-xs text-neutral-500 mt-1">PDF or Text files</p>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 px-1 flex justify-between items-center">
          Your Documents
          {loading && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
        </h2>
        <div className="space-y-2">
          {files.length === 0 && !loading && (
            <div className="p-4 rounded-xl border border-neutral-800/50 bg-neutral-900/20 text-center">
              <p className="text-sm text-neutral-500">No documents found.</p>
            </div>
          )}
          {files.map(file => (
            <div key={file.id} className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50 flex items-center gap-3 hover:border-indigo-500/30 hover:bg-neutral-900 transition-all cursor-default group shadow-sm">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-neutral-200">{file.filename}</p>
                <p className="text-xs text-green-500/80 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Ingested
                </p>
              </div>
              <button 
                onClick={(e) => handleDelete(file.id, e)}
                className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {reviewThreadId && (
        <ReviewModal 
          threadId={reviewThreadId} 
          onClose={() => setReviewThreadId(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
