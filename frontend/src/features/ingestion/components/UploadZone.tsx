"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Tag, Check, Shield } from "lucide-react";
import axios from "axios";
import { useIngestionStore } from "../store/useIngestionStore";
import { useDocuments } from "../hooks/useDocuments";
import { getAuthHeaders, fetchTags } from "@/lib/api";
import { Card, Button, Badge } from "@/components/ui";
import { TagItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function UploadZone() {
  const { status, setStatus, uploadProgress, setUploadProgress, setFile } = useIngestionStore();
  const { mutate } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);

  useEffect(() => {
    fetchTags()
      .then((data) => setAvailableTags(data || []))
      .catch((err) => console.error("Failed to load tags in UploadZone:", err));
  }, []);

  const toggleTag = (tagName: string) => {
    setSelectedTagNames((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStatus('uploading');
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (selectedTagNames.length > 0) {
        formData.append("tags", JSON.stringify(selectedTagNames));
      }
      
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
        setSelectedTagNames([]);
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
    <section className="w-full mb-xl space-y-4">
      {/* Optional OBAC Tag Selector */}
      {availableTags.length > 0 && status === 'idle' && (
        <Card variant="default" className="p-4 bg-surface-container-high/40 border border-outline-variant/30 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-label-md text-xs font-semibold text-white uppercase tracking-wide">
                Assign OBAC Tag to Upload (Optional)
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-body-sm">
              {selectedTagNames.length > 0
                ? `${selectedTagNames.length} tag(s) selected`
                : "No tags selected (Public access)"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTagNames.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label-md text-xs transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? "bg-primary/20 text-primary border-primary/50 shadow-sm"
                      : "bg-surface-variant/40 text-on-surface-variant border-outline-variant/30 hover:border-outline-variant hover:text-white"
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept=".pdf,.docx,.txt,.md" 
      />
      <Card
        className={`border-dashed p-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 h-64 ${status === 'uploading' ? 'opacity-50 pointer-events-none' : 'hover:border-outline hover:shadow-xl'}`}
        onClick={() => status === 'idle' && fileInputRef.current?.click()}
      >
          {status === 'uploading' ? (
            <div className="w-full max-w-md flex flex-col items-center">
              <div className="w-full bg-surface-variant rounded-full h-4 mb-4 overflow-hidden border border-outline-variant">
                <div 
                  className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] h-4 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="font-label-md text-label-md text-on-surface mb-xs">Uploading Document...</p>
              <p className="font-body-sm text-body-sm text-primary font-bold">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-surface-variant/40 border border-outline-variant/30 flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-on-surface-variant" />
              </div>
              <p className="font-label-md text-label-md text-on-surface mb-xs">Drag and drop your file here</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Supports PDF, DOCX, TXT, MD (Max 50MB)</p>
              <Button variant="primary" className="mt-4">
                Select File
              </Button>
            </>
          )}
      </Card>
    </section>
  );
}
