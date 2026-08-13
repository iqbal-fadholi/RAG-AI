import { create } from 'zustand';
import { DocStatus, ParsedDoc } from '@/types';

interface IngestionState {
  status: DocStatus;
  uploadProgress: number;
  file: File | null;
  parsedDoc: ParsedDoc | null;
  editedMarkdown: string;
  
  setStatus: (status: DocStatus) => void;
  setUploadProgress: (progress: number) => void;
  setFile: (file: File | null) => void;
  setParsedDoc: (doc: ParsedDoc | null) => void;
  setEditedMarkdown: (markdown: string) => void;
  reset: () => void;
}

export const useIngestionStore = create<IngestionState>((set) => ({
  status: 'idle',
  uploadProgress: 0,
  file: null,
  parsedDoc: null,
  editedMarkdown: "",
  
  setStatus: (status) => set({ status }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  setFile: (file) => set({ file }),
  setParsedDoc: (parsedDoc) => set({ parsedDoc }),
  setEditedMarkdown: (editedMarkdown) => set({ editedMarkdown }),
  reset: () => set({
    status: 'idle',
    uploadProgress: 0,
    file: null,
    parsedDoc: null,
    editedMarkdown: "",
  })
}));
