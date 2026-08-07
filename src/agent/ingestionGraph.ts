import { StateGraph, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "../db/pgvector.js";

export const IngestionStateAnnotation = Annotation.Root({
  fileBuffer: Annotation<Buffer>(),
  fileName: Annotation<string>(),
  mimeType: Annotation<string>(),
  extractedMarkdown: Annotation<string>(),
  reviewStatus: Annotation<"pending" | "approved" | "rejected">(),
});

type IngestionState = typeof IngestionStateAnnotation.State;

async function parseDocumentNode(state: IngestionState): Promise<Partial<IngestionState>> {
  // Send the file to the Docling FastAPI service
  const { fileBuffer, fileName, mimeType } = state;

  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, fileName);

  console.log(`Sending ${fileName} to Docling service...`);
  const response = await fetch("http://docling-service:8000/parse", {
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
  // The actual update (e.g. reviewStatus = "approved" and edited extractedMarkdown)
  // will be done via external API call updating the graph state.
  return {};
}

async function processAndSaveNode(state: IngestionState): Promise<Partial<IngestionState>> {
  if (state.reviewStatus !== "approved") {
    console.log("Document ingestion was not approved. Skipping save.");
    return {};
  }

  console.log("Document approved. Splitting and saving to pgvector...");
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // Create documents from the reviewed markdown
  const docs = [{ 
    pageContent: state.extractedMarkdown, 
    metadata: { source: state.fileName } 
  }];

  const splits = await textSplitter.splitDocuments(docs);

  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(splits);

  console.log(`Saved ${splits.length} chunks to vector store.`);
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
