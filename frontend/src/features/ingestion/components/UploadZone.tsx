import { useRef } from "react";
import { UploadCloud } from "lucide-react";
import axios from "axios";
import { useIngestionStore } from "../store/useIngestionStore";
import { useDocuments } from "../hooks/useDocuments";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function UploadZone() {
  const { status, setStatus, uploadProgress, setUploadProgress, setFile } = useIngestionStore();
  const { mutate } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStatus('uploading');
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      try {
        await axios.post(`${API_URL}/ingest/start`, formData, {
          headers: {
            ...getAuthHeaders(),
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        });
        
        setStatus('idle');
        setUploadProgress(0);
        setFile(null);
        mutate();
      } catch (error: any) {
        console.error(error);
        if (error?.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
        setStatus('idle');
        setUploadProgress(0);
        setFile(null);
      }
    }
  };

  if (status !== 'idle' && status !== 'uploading') return null;

  return (
    <section className="w-full mb-xl">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept=".pdf,.docx,.txt,.md" 
      />
      <div 
        className={`glass-panel border-dashed rounded-[2rem] p-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-64 ${status === 'uploading' ? 'opacity-50 pointer-events-none' : 'hover:border-outline'}`}
        onClick={() => status === 'idle' && fileInputRef.current?.click()}
      >
          {status === 'uploading' ? (
            <div className="w-full max-w-md flex flex-col items-center">
              <div className="w-full bg-surface-variant rounded-full h-4 mb-4 overflow-hidden border border-outline-variant">
                <div 
                  className="bg-primary h-4 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="font-label-md text-label-md text-on-surface mb-xs">Uploading Document...</p>
              <p className="font-body-sm text-body-sm text-primary font-bold">{uploadProgress}%</p>
            </div>
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
  );
}
