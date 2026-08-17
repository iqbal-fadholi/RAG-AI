"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, TableProperties, FileText, RefreshCw, Tag } from "lucide-react";
import { deleteFile, getIngestionStatus, retryIngestion, fetchTags, updateDocumentTags } from "@/lib/api";
import { useIngestionStore } from "../store/useIngestionStore";
import { useDocuments } from "../hooks/useDocuments";
import { Card, DataTable, Badge, Button } from "@/components/ui";
import { DocumentTagsModal } from "./DocumentTagsModal";
import { DocumentData, TagItem } from "@/types";

export function HistoryTable() {
  const router = useRouter();
  const { documents, mutate } = useDocuments();
  const { setStatus, setFile, setParsedDoc, setEditedMarkdown, parsedDoc } = useIngestionStore();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [selectedDocForTags, setSelectedDocForTags] = useState<DocumentData | null>(null);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    fetchTags().then(setAvailableTags).catch(console.error);
  }, []);

  const handleSaveDocTags = async (docId: string, tagIds: string[]) => {
    setSavingTags(true);
    try {
      await updateDocumentTags(docId, tagIds);
      mutate();
    } finally {
      setSavingTags(false);
    }
  };

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

  const handleRetry = async (docId: string) => {
    setRetryingId(docId);
    try {
      await retryIngestion(docId);
      mutate();
    } catch (error) {
      console.error('Failed to retry ingestion:', error);
      alert('Failed to retry ingestion: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setRetryingId(null);
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
        return <Badge variant="default" dot>Queued</Badge>;
      case 'processing':
      case 'extracting text...':
      case 'chunking and saving...':
        return (
          <Badge variant="primary" dot dotPulse>
            {docStatus.replace(/\.\.\.$/, '').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        );
      case 'pending_review':
      case 'pending':
        return <Badge variant="warning" dot>Pending Review</Badge>;
      case 'approved':
      case 'done':
        return <Badge variant="success" dot>Done</Badge>;
      case 'error':
        return <Badge variant="danger" dot>Error</Badge>;
      default:
        return <Badge variant="default" dot>{docStatus}</Badge>;
    }
  };

  return (
    <section className="w-full mt-8">
      <Card className="shadow-2xl">
        <Card.Header>
          <h2 className="font-headline-md text-headline-md text-white">Ingested Documents History</h2>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-on-surface-variant font-label-md text-label-md">Live Updates</span>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <DataTable>
            <DataTable.Head>
              <tr>
                <DataTable.Header>Document Name</DataTable.Header>
                <DataTable.Header>Status</DataTable.Header>
                <DataTable.Header>Tags (OBAC)</DataTable.Header>
                <DataTable.Header>Date Added</DataTable.Header>
                <DataTable.Header>Type</DataTable.Header>
                <DataTable.Header className="text-right">Actions</DataTable.Header>
              </tr>
            </DataTable.Head>
            <DataTable.Body>
              {documents.length === 0 ? (
                <DataTable.Empty colSpan={6} message="No uploaded documents found." />
              ) : (
                documents.map((doc) => (
                  <DataTable.Row key={doc.id}>
                    <DataTable.Cell className="flex items-center gap-3 font-medium text-white truncate max-w-[220px]" title={doc.filename}>
                      {getFileIcon(doc.filename)}
                      {doc.filename}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {getStatusBadge(doc.status)}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {doc.tags && doc.tags.length > 0 ? (
                          doc.tags.map((t) => (
                            <Badge key={t.id} variant="primary" icon={<Tag className="w-3 h-3" />}>
                              {t.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="default" className="opacity-60 text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                    </DataTable.Cell>
                    <DataTable.Cell className="text-on-surface-variant">
                      {new Date(doc.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </DataTable.Cell>
                    <DataTable.Cell className="text-on-surface-variant font-medium">
                      {doc.filename.split('.').pop()?.toUpperCase() || 'N/A'}
                    </DataTable.Cell>
                    <DataTable.Cell className="text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Button
                          variant="ghost"
                          iconOnly
                          icon={<Tag className="w-4 h-4" />}
                          onClick={() => setSelectedDocForTags(doc)}
                          title="Manage OBAC Tags"
                          className="hover:text-primary hover:bg-primary/10"
                        />
                        <Button
                          variant="ghost"
                          iconOnly
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => router.push(`/ingest/${doc.id}`)}
                          title="View Details"
                          className="hover:text-primary hover:bg-primary/10"
                        />
                        {(doc.status === 'pending_review' || doc.status === 'pending') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleResumeReview(doc.id, doc.filename)}
                            className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
                          >
                            Review
                          </Button>
                        )}
                        {(doc.status === 'error' || doc.status === 'chunking and saving...') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={retryingId === doc.id}
                            icon={<RefreshCw className="w-3.5 h-3.5" />}
                            onClick={() => handleRetry(doc.id)}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30 font-medium"
                            title="Retry chunking and saving to pgvector"
                          >
                            Retry
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          iconOnly
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDelete(doc.id)}
                          title="Delete Document"
                          className="hover:text-red-400 hover:bg-red-500/10"
                        />
                      </div>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              )}
            </DataTable.Body>
          </DataTable>
        </Card.Body>
      </Card>

      {/* Document Tags Modal */}
      <DocumentTagsModal
        isOpen={!!selectedDocForTags}
        docId={selectedDocForTags?.id || null}
        docFilename={selectedDocForTags?.filename || ""}
        currentTags={selectedDocForTags?.tags || []}
        availableTags={availableTags}
        saving={savingTags}
        onClose={() => setSelectedDocForTags(null)}
        onSave={handleSaveDocTags}
        onTagCreated={(newTag) => setAvailableTags((prev) => [...prev.filter((t) => t.id !== newTag.id), newTag])}
      />
    </section>
  );
}
