import { StateGraph, Annotation } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from "uuid";
import { VectorStoreRepository } from "../data-access/vectorStoreRepository.js";
import { config } from "../../../libraries/config/index.js";
import { pool, getPostgresSaver } from "../../../libraries/db/checkpoint.js";
import { updateDocumentStatus, updateDocumentMarkdown, deleteDocumentChunks } from "../../../libraries/db/documents.js";

export const IngestionStateAnnotation = Annotation.Root({
  fileBuffer: Annotation<Buffer>(),
  fileName: Annotation<string>(),
  mimeType: Annotation<string>(),
  extractedMarkdown: Annotation<string>(),
  reviewStatus: Annotation<"pending" | "approved" | "rejected">(),
});

type IngestionState = typeof IngestionStateAnnotation.State;

const vectorStoreRepo = new VectorStoreRepository();

async function parseDocumentNode(state: IngestionState, configObj?: any): Promise<Partial<IngestionState>> {
  const { fileBuffer, fileName, mimeType } = state;
  const thread_id = configObj?.configurable?.thread_id;

  if (thread_id) {
    await updateDocumentStatus(thread_id, 'extracting text...');
  }

  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, fileName);

  console.log(`Sending ${fileName} to Docling service...`);
  const response = await fetch(`${config.doclingServiceUrl}/parse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Docling API error: ${errorText}`);
  }

  const data = await response.json();
  if (thread_id && data.markdown) {
    await updateDocumentMarkdown(thread_id, data.markdown);
  }

  return {
    extractedMarkdown: data.markdown,
    reviewStatus: "pending",
  };
}

async function humanReviewNode(state: IngestionState): Promise<Partial<IngestionState>> {
  // This node just serves as a breakpoint.
  // The actual update will be done via external API call updating the graph state.
  return {};
}

export async function executeChunkAndSave(thread_id: string, fileName: string, markdown: string): Promise<void> {
  console.log(`[ChunkAndSave] Starting chunking & saving for ${fileName} (${thread_id})...`);
  await updateDocumentStatus(thread_id, 'chunking and saving...');
  
  try {
    // 1. Purge any previous/partial chunks to ensure idempotency on retries
    await deleteDocumentChunks(thread_id);

    // 2. Semantic Chunking: Split by Markdown structure first
    const textSplitter = new MarkdownTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments(
      [markdown],
      [{ file_id: thread_id, filename: fileName }]
    );
    
    // 3. Save to pgvector
    await vectorStoreRepo.addDocuments(docs);
    
    await updateDocumentStatus(thread_id, 'done');
    console.log(`[ChunkAndSave] Documents successfully saved to pgvector for ${thread_id}`);
  } catch (error) {
    console.error(`[ChunkAndSave] Failed for ${thread_id}:`, error);
    await updateDocumentStatus(thread_id, 'error');
    throw error;
  }
}

async function processAndSaveNode(state: IngestionState, configObj?: any): Promise<Partial<IngestionState>> {
  if (state.reviewStatus !== "approved") {
    console.log("Document ingestion was not approved. Skipping save.");
    return {};
  }

  const thread_id = configObj?.configurable?.thread_id;
  if (!thread_id) throw new Error("thread_id is required");
  
  await executeChunkAndSave(thread_id, state.fileName, state.extractedMarkdown);

  return {};
}

function shouldProcess(state: IngestionState): "processAndSaveNode" | "__end__" {
  if (state.reviewStatus === "approved") {
    return "processAndSaveNode";
  }
  return "__end__";
}

// Build the graph
const builder = new StateGraph(IngestionStateAnnotation)
  .addNode("parseDocumentNode", parseDocumentNode)
  .addNode("humanReviewNode", humanReviewNode)
  .addNode("processAndSaveNode", processAndSaveNode)
  .addEdge("__start__", "parseDocumentNode")
  .addEdge("parseDocumentNode", "humanReviewNode")
  .addConditionalEdges("humanReviewNode", shouldProcess)
  .addEdge("processAndSaveNode", "__end__");

// Initialize database checkpointer tables asynchronously in the background
(async () => {
  try {
    await getPostgresSaver();
    console.log("Ingestion Database tables initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize ingestion database tables:", err);
  }
})();

// We use PostgresSaver to allow pausing and resuming across restarts
export const checkpointer = new PostgresSaver(pool);
export const ingestionGraph = builder.compile({
  checkpointer,
  interruptBefore: ["humanReviewNode"],
});
