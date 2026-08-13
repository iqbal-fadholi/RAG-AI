import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { DocumentData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useDocuments() {
  const { data, error, isLoading, mutate } = useSWR<DocumentData[]>(
    `${API_URL}/ingest/files`,
    fetcher,
    { refreshInterval: 3000 }
  );

  return {
    documents: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
