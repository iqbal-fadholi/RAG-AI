"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Tag, Check, Shield, Plus, X, Loader2 } from "lucide-react";
import axios from "axios";
import { useIngestionStore } from "../store/useIngestionStore";
import { useDocuments } from "../hooks/useDocuments";
import { getAuthHeaders, fetchTags, createTag } from "@/lib/api";
import { Card, Button, Badge } from "@/components/ui";
import { TagItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function UploadZone() {
  const { status, setStatus, uploadProgress, setUploadProgress, setFile } = useIngestionStore();
  const { mutate } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

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

  const handleCreateTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    setCreatingTag(true);
    setTagError(null);
    try {
      const created = await createTag(trimmed);
      // Avoid duplicate in availableTags
      setAvailableTags((prev) => {
        if (prev.some((t) => t.id === created.id || t.name.toLowerCase() === created.name.toLowerCase())) {
          return prev;
        }
        return [...prev, created];
      });
      // Automatically select the newly created tag
      setSelectedTagNames((prev) =>
        prev.includes(created.name) ? prev : [...prev, created.name]
      );
      setNewTagName("");
      setShowAddTag(false);
    } catch (err: unknown) {
      setTagError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
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
      {/* OBAC Tag Selector */}
      {status === 'idle' && (
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

          {tagError && (
            <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-body-sm flex items-center justify-between">
              <span>{tagError}</span>
              <button onClick={() => setTagError(null)} className="text-red-400 hover:text-white p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
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

            {/* Inline Add Tag Form or Button */}
            {showAddTag ? (
              <form onSubmit={handleCreateTag} className="inline-flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="New tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  autoFocus
                  disabled={creatingTag}
                  className="px-2.5 py-1 text-xs rounded-xl bg-surface-container-high border border-primary/50 text-white placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary h-[30px] w-36"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={creatingTag || !newTagName.trim()}
                  className="h-[30px] px-2.5 text-xs py-0"
                >
                  {creatingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTag(false);
                    setNewTagName("");
                    setTagError(null);
                  }}
                  disabled={creatingTag}
                  className="p-1 text-on-surface-variant hover:text-white rounded-lg hover:bg-surface-variant/60 transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddTag(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-label-md text-xs border border-dashed border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70 transition-all cursor-pointer"
                title="Create a new tag"
              >
                <Plus className="w-3 h-3" />
                <span>Add Tag</span>
              </button>
            )}
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
