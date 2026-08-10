import { StateGraph, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from "uuid";
import { VectorStoreRepository } from "../data-access/vectorStoreRepository.js";
import { config } from "../../../libraries/config/index.js";
import { pool } from "../../../libraries/db/checkpoint.js";

export const IngestionStateAnnotation = Annotation.Root({
  fileBuffer: Annotation<Buffer>(),
  fileName: Annotation<string>(),
  mimeType: Annotation<string>(),
  extractedMarkdown: Annotation<string>(),
  reviewStatus: Annotation<"pending" | "approved" | "rejected">(),
});

type IngestionState = typeof IngestionStateAnnotation.State;

const vectorStoreRepo = new VectorStoreRepository();

async function parseDocumentNode(state: IngestionState): Promise<Partial<IngestionState>> {
  const { fileBuffer, fileName, mimeType } = state;

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

async function processAndSaveNode(state: IngestionState): Promise<Partial<IngestionState>> {
  if (state.reviewStatus !== "approved") {
    console.log("Document ingestion was not approved. Skipping save.");
    return {};
  }

  console.log("Document approved. Splitting and saving to pgvector...");
  
  const file_id = uuidv4();
  
  // Save to uploaded_files table
  await pool.query(
    'INSERT INTO uploaded_files (id, filename) VALUES ($1, $2)',
    [file_id, state.fileName]
  );

  // Semantic Chunking: Split by Markdown structure (Headers, Paragraphs, Lists) first,
  // falling back to character limits only if a semantic block is too large.
  const textSplitter = new MarkdownTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const docs = [{ 
    pageContent: state.extractedMarkdown, 
    metadata: { source: state.fileName, file_id } 
  }];

  const splits = await textSplitter.splitDocuments(docs);

  await vectorStoreRepo.addDocuments(splits);

  console.log(`Saved ${splits.length} chunks to vector store for file ${file_id}.`);
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

// We use MemorySaver to allow pausing and resuming
export const checkpointer = new MemorySaver();
export const ingestionGraph = builder.compile({
  checkpointer,
  interruptBefore: ["humanReviewNode"],
});
