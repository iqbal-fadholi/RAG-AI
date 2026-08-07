# Self-Correcting RAG Backend MVP with Docling Ingestion

This repository contains a Self-Correcting RAG Application using LangChain, LangGraph, Google Gemini, and Express.js in TypeScript, along with a powerful document ingestion pipeline using Docling via a Python FastAPI microservice.

## Features

1. **Advanced Document Ingestion (Docling + LangGraph)** ([src/agent/ingestionGraph.ts](file:///Users/muhammadiqbalfadholi/RAG/src/agent/ingestionGraph.ts))
   - A LangGraph workflow orchestrates document ingestion.
   - Files are sent to a Python FastAPI microservice that runs **Docling** to extract rich Markdown from complex documents (e.g., PDFs).
   - **Human-In-The-Loop (HITL)**: The ingestion pauses, allowing you to review and optionally edit the extracted Markdown before it is chunked and stored in PGVector.

2. **Self-Correcting RAG Workflow** ([src/agent/graph.ts](file:///Users/muhammadiqbalfadholi/RAG/src/agent/graph.ts))
   - Retrieves documents from `pgvector`.
   - Uses Gemini to **grade** the documents.
   - If relevant, it **generates** an answer.
   - If irrelevant, it **rewrites** the user's question and loops back to retrieval!

3. **Express Server API** ([src/index.ts](file:///Users/muhammadiqbalfadholi/RAG/src/index.ts))
   - Exposes REST endpoints for chatting, uploading documents, and managing the HITL ingestion workflow.

## Running the Application

Everything is orchestrated using Docker Compose!

> [!IMPORTANT]
> **1. Set up Environment Variables**
> Environment variables for the Node API are now managed directly in `docker-compose.yml`. Ensure you have your `GOOGLE_API_KEY` set correctly in the `docker-compose.yml` file under the `node-api` service.

> [!TIP]
> **2. Start Services**
> Run the following command to start PostgreSQL (pgvector), the Docling microservice, and the Express Node API all together:
>
> ```bash
> docker-compose up --build -d
> ```

## API Usage

The Express API is available at `http://localhost:3000`.

### 1. Ingestion Workflow (Docling + LangGraph)

**Step 1: Start Ingestion**
Upload a document (like a complex PDF):
```bash
curl -X POST -F "file=@your_document.pdf" http://localhost:3000/ingest/start
```
*This returns a `thread_id`.*

**Step 2: Check Status & Review Markdown**
Use the `thread_id` to inspect the generated Markdown from Docling:
```bash
curl http://localhost:3000/ingest/status/<thread_id>
```

**Step 3: (Optional) Edit Markdown**
If the extracted Markdown needs adjustments before saving:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"markdown": "# Edited Header\n\nContent..."}' http://localhost:3000/ingest/edit/<thread_id>
```

**Step 4: Approve Ingestion**
Approve the document to trigger chunking and vector storage in PGVector:
```bash
curl -X POST http://localhost:3000/ingest/approve/<thread_id>
```

### 2. Chat (Self-Correcting RAG)

Ask a question to trigger the self-correcting RAG LangGraph agent:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of the document?"}'
```
