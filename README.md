# Self-Correcting RAG Backend MVP with Docling Ingestion

This repository contains a Self-Correcting RAG Application using LangChain, LangGraph, Google Gemini, and Express.js in TypeScript, along with a document ingestion pipeline using Docling via a Python FastAPI microservice.

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
│   │       ├── chatGraph.ts       # Self-Correcting RAG LangGraph workflow
│   │       └── chatSchema.ts      # Zod request validation schema
│   └── ingestion/                 # Document ingestion & HITL component
│       ├── entry-points/
│       │   └── ingestionRoutes.ts # Ingestion API endpoints (/ingest/*)
│       ├── domain/
│       │   ├── ingestionGraph.ts  # Ingestion workflow graph
│       │   └── ingestionSchema.ts # Validation schemas (edit/approve/status)
│       └── data-access/
│           └── vectorStoreRepository.ts # Database operations wrapper
└── libraries/
    ├── config/
    │   └── index.ts               # Zod schema-validated configuration
    ├── db/
    │   └── pgvector.ts            # PGVector database client helper
    └── error-handling/
        ├── AppError.ts            # Custom operational & programmer error class
        ├── errorHandler.ts        # Centralized Express error handler middleware
        └── asyncWrapper.ts        # Boilerplate-free async route helper
```

---

## Features

1. **Self-Correcting RAG Workflow** ([src/components/chat/domain/chatGraph.ts](file:///Users/muhammadiqbalfadholi/RAG/src/components/chat/domain/chatGraph.ts))
   - Retrieves documents from pgvector.
   - Grades documents using Gemini.
   - Generates answers if relevant, otherwise rewrites the query and loops back to retrieval.

2. **Advanced Ingestion In LangGraph** ([src/components/ingestion/domain/ingestionGraph.ts](file:///Users/muhammadiqbalfadholi/RAG/src/components/ingestion/domain/ingestionGraph.ts))
   - Sends files to the Python FastAPI microservice running **Docling** to extract rich Markdown from PDFs/text.
   - **Human-In-The-Loop (HITL)**: Workflow interrupts before saving to allow manual markdown editing and review.

3. **Schema-Validated Config & Requests**
   - Config is strictly validated at startup with Zod.
   - Request bodies/parameters are validated with Zod before execution.

---

## Running the Application

Everything is orchestrated using Docker Compose (or Podman Compose) with a clean multi-stage build.

### 1. Set up Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
Ensure you set your `GOOGLE_API_KEY` inside `.env`. Secrets are loaded into the container via the compose `env_file` config (never committed).

### 2. Start Services
Run the following command to build and launch all containers (Postgres, Node API, Docling service):
```bash
podman compose up --build -d
```

---

## API Usage

The Express API is exposed on `http://localhost:3000`.

### 1. Ingestion Workflow

**Step 1: Start Ingestion**
Upload a document (PDF or plaintext) to trigger the graph:
```bash
curl -X POST -F "file=@your_document.pdf" http://localhost:3000/ingest/start
```
*Returns a `thread_id`.*

**Step 2: Check Status & Review Markdown**
Inspect the extracted markdown:
```bash
curl http://localhost:3000/ingest/status/<thread_id>
```

**Step 3: (Optional) Edit Markdown**
Submit adjustments if needed:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"markdown": "# Edited Header\n\nContent..."}' \
  http://localhost:3000/ingest/edit/<thread_id>
```

**Step 4: Approve Ingestion**
Approve the document to split, chunk, and embed into PGVector:
```bash
curl -X POST http://localhost:3000/ingest/approve/<thread_id>
```

### 2. Chat (RAG)

Submit a question to run the self-correcting RAG agent:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of the document?"}'
```
*Outputs SSE (Server-Sent Events) tokens, progress events, and final document metadata.*
