# Self-Correcting RAG Backend MVP - Walkthrough

I have successfully implemented the MVP for your Self-Correcting RAG Application using LangChain, LangGraph, Google Gemini, and Express.js in TypeScript!

Here is what was built:

1. **Express Server & API Routes** ([src/index.ts](file:///Users/muhammadiqbalfadholi/RAG/src/index.ts))
   - `POST /api/upload`: Accepts a file (PDF or TXT) via `multipart/form-data`, chunks it, and ingests it into the vector database.
   - `POST /api/chat`: Accepts a JSON body with a `question`, and runs the LangGraph agent to answer it.

2. **Self-Correcting LangGraph Workflow** ([src/agent/graph.ts](file:///Users/muhammadiqbalfadholi/RAG/src/agent/graph.ts))
   - The graph retrieves documents from `pgvector`.
   - It then uses Gemini to **grade** the documents.
   - If the documents are relevant, it **generates** an answer.
   - If none of the documents are relevant, it **rewrites** the user's question and loops back to retrieval!

3. **Ingestion & Vector DB** ([src/ingest.ts](file:///Users/muhammadiqbalfadholi/RAG/src/ingest.ts), [src/db/pgvector.ts](file:///Users/muhammadiqbalfadholi/RAG/src/db/pgvector.ts))
   - Memory storage via `multer` allows us to process files directly.
   - `pgvector` handles storing the embeddings using `text-embedding-004`.

## Next Steps to Run the MVP

Before you can run the server, you need to set up your environment variables and start the database.

> [!IMPORTANT]
> **1. Set up Environment Variables**
> Run the following command in your terminal to create your `.env` file:
>
> ```bash
> cp .env.example .env
> ```
>
> Then, open the `.env` file and fill in your `GOOGLE_API_KEY`. If you want to use LangSmith for tracing (highly recommended to visualize the graph), add your `LANGCHAIN_API_KEY` as well.

> [!NOTE]
> **2. Start PostgreSQL**
> We've included a `docker-compose.yml` file. Run this command to start the database in the background:
>
> ```bash
> docker-compose up -d
> ```

> [!TIP]
> **3. Start the Server**
> Run the development server using:
>
> ```bash
> npm run dev
> ```

## Testing the API

Once the server is running, you can test it using `curl` or Postman.

**1. Upload a Document**

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/your/document.pdf"
```

**2. Ask a Question**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of the document?"}'
```
