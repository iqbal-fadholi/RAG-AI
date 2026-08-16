"use client";

import useSWR from "swr";
import { useState, useCallback, useEffect } from "react";
import { fetcher } from "@/lib/api";
import { getSearchRegex } from "../utils/highlighting";

export interface DocumentDetail {
  id: string;
  filename: string;
  status: string;
  s3_key: string;
  uploaded_at: string;
  extractedMarkdown: string;
  tags?: { id: string; name: string }[];
}

export interface Chunk {
  id: string;
  page_content: string;
  metadata: Record<string, unknown>;
}

export type ActiveTab = "extracted-text" | "vector-chunks";

export function useDocumentDetail(docId: string) {
  const { data: doc, error: docError, isLoading: loadingDoc, mutate: mutateDoc } = useSWR<DocumentDetail>(
    docId ? `/ingest/files/${docId}` : null,
    fetcher
  );

  const { data: chunksData, error: chunksError, isLoading: loadingChunks, mutate: mutateChunks } = useSWR<Chunk[]>(
    docId ? `/ingest/files/${docId}/chunks` : null,
    fetcher
  );

  const chunks = chunksData || [];
  const error = docError 
    ? (docError as Error).message || "Failed to load document" 
    : chunksError 
      ? (chunksError as Error).message || "Failed to load chunks" 
      : null;

  const [activeTab, setActiveTab] = useState<ActiveTab>("extracted-text");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  // Reset match index when search params change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentMatchIndex(0);
  }, [searchQuery, caseSensitive, useRegex]);

  const toggleChunkExpansion = useCallback((chunkId: string) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) {
        next.delete(chunkId);
      } else {
        next.add(chunkId);
      }
      return next;
    });
  }, []);

  const scrollToMatch = useCallback((elementId: string) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }, []);

  const filteredChunks = searchQuery
    ? chunks.filter((c) => {
        const regex = getSearchRegex(searchQuery, caseSensitive, useRegex);
        if (!regex) return false;
        return regex.test(c.page_content);
      })
    : chunks;

  return {
    doc,
    chunks,
    filteredChunks,
    loadingDoc,
    loadingChunks,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    expandedChunks,
    toggleChunkExpansion,
    viewMode,
    setViewMode,
    currentMatchIndex,
    setCurrentMatchIndex,
    caseSensitive,
    setCaseSensitive,
    useRegex,
    setUseRegex,
    scrollToMatch,
    mutateDoc,
    mutateChunks,
  };
}
