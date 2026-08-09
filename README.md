# Self-Correcting RAG Backend MVP with Docling Ingestion

This repository contains an Advanced RAG Application using LangChain, LangGraph, Google Gemini, and Express.js in TypeScript. It features a document ingestion pipeline using Docling via a Python FastAPI microservice, and a robust conversational interface with persistent memory, streaming, and zero-shot LLM reranking.

The project structure is organized by **business domains** and layered into **3-tiers** following Node.js best practices.

---

## Architecture Overview

The codebase is split into dedicated, autonomous components and shared libraries:

```
src/
├── app.ts                         # Express application setup
├── server.ts                      # Server bootstrap & graceful shutdown
├── components/
│   ├── chat/                      # RAG query & retrieval component
│   │   ├── entry-points/
│   │   │   └── chatRoutes.ts      # HTTP endpoints (/api/chat)
│   │   └── domain/
│   │       ├── chatGraph.ts       # LangGraph workflow (Memory, Condense, Rerank, Generate)
│   │       └── chatSchema.ts      # Zod request validation schema
│   └── ingestion/                 # Document ingestion & HITL component
│       ├── entry-points/
│       │   └── ingestionRoutes.ts # Ingestion API endpoints (/ingest/*)
│       ├── domain/
│       │   ├── ingestionGraph.ts  # Ingestion workflow graph
│       │   └── ingestionSchema.ts # Validation schemas
│       └── data-access/
│           └── vectorStoreRepository.ts # Database operations wrapper
└── libraries/
    ├── config/
    │   └── index.ts               # Zod schema-validated configuration
    ├── db/
    │   ├── pgvector.ts            # PGVector database client helper
    │   ├── checkpoint.ts          # PostgresSaver checkpointer for LangGraph
    │   └── documents.ts           # Document API (List/Delete files)
    └── error-handling/
        ├── AppError.ts            # Custom operational & programmer error class
        ├── errorHandler.ts        # Centralized Express error handler middleware
        └── asyncWrapper.ts        # Boilerplate-free async route helper
```

---

## Features

1. **Self-Correcting RAG Workflow** ([chatGraph.ts](file:///Users/muhammadiqbalfadholi/RAG/src/components/chat/domain/chatGraph.ts))
   - **Conversation History (Memory)**: Uses `PostgresSaver` to persist multi-turn chat threads to the database.
   - **Query Rewriting**: Contextualizes follow-up questions using chat history before querying the vector store.
   - **Advanced Retrieval**: Fetches top 10 documents, then uses Gemini to perform Zero-Shot LLM Reranking (scoring 1-10) to select the 4 most relevant chunks.
   - **Streaming Responses**: Yields real-time Server-Sent Events (SSE) for both graph progress nodes and LLM tokens.
   - **Self-Correction**: If no relevant documents are found, rewrites the standalone query and retries retrieval up to 3 times.

2. **Advanced Ingestion In LangGraph** ([ingestionGraph.ts](file:///Users/muhammadiqbalfadholi/RAG/src/components/ingestion/domain/ingestionGraph.ts))
   - Sends files to a Python FastAPI microservice running **Docling** to extract rich Markdown from PDFs/text.
   - **Human-In-The-Loop (HITL)**: Workflow interrupts before saving to allow manual markdown editing and review.
   - **Document Management**: Records high-level document info (`uploaded_files`) and injects a `file_id` into all vector chunk metadata.

---

## Running the Application

Everything is orchestrated using Docker Compose with a clean multi-stage build.

### 1. Set up Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
Ensure you set your `GOOGLE_API_KEY` inside `.env`. Secrets are loaded into the container via the compose `env_file` config (never committed).

### 2. Start Services
Run the following command to build and launch all containers (Postgres, Node API, Docling service). You can use either `docker` or `podman`:

```bash
docker compose up --build -d
# OR
podman compose up --build -d
```

---

## API Usage

The Express API is exposed on `http://localhost:3000`.

### 1. Ingestion & Document Management

**Start Ingestion**
Upload a document (PDF or plaintext) to trigger the graph:
```bash
curl -X POST -F "file=@your_document.pdf" http://localhost:3000/ingest/start
```
*Returns a `thread_id`.*

**Check Status & Review Markdown**
Inspect the extracted markdown:
```bash
curl http://localhost:3000/ingest/status/<thread_id>
```

**(Optional) Edit Markdown**
Submit adjustments if needed:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"markdown": "# Edited Header\n\nContent..."}' \
  http://localhost:3000/ingest/edit/<thread_id>
```

**Approve Ingestion**
Approve the document to split, chunk, and embed into PGVector:
```bash
curl -X POST http://localhost:3000/ingest/approve/<thread_id>
```

**View Uploaded Documents**
List all successfully processed documents:
```bash
curl http://localhost:3000/ingest/files
```

**Delete a Document**
Remove a file and wipe all of its vector chunks from the database:
```bash
curl -X DELETE http://localhost:3000/ingest/files/<id_from_list>
```

---

### 2. Chat (RAG)

Submit a question to run the self-correcting RAG agent:
```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of the document?"}'
```
*Outputs SSE (Server-Sent Events) tokens, progress events, and final document metadata.* 

*Watch the SSE stream for an `event: thread`. Copy that `thread_id` for your follow-up questions to utilize conversational memory:*

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is its main advantage?", 
    "thread_id": "<thread_id_from_previous_response>"
  }'
```
