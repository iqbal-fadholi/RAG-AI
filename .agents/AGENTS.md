# LangGraph Project Guidelines

Follow these guidelines when building and exposing LangGraph workflows in this workspace:

## 1. Graph Compilation and Checkpointing Lifecycle
- **Compile Once**: Compile the `StateGraph` workflow once at the module level rather than inside HTTP request handlers or dynamically on every request.
- **Async Setup**: Do not invoke `checkpointer.setup()` or table migrations synchronously inside route handlers. Perform checkpointer database initialization asynchronously in the background at module load (e.g., via an IIFE in the graph file) or during application bootstrap. This prevents connection pool exhaustion and database locks.
- **Singleton Setup & Advisory Locks**: Memoize the checkpointer initialization function (e.g. `getPostgresSaver()`) using a module-level singleton Promise to prevent concurrent execution across graph modules. Wrap custom table migrations in PostgreSQL advisory locks (`SELECT pg_advisory_lock(...)`) to prevent `pg_type_typname_nsp_index` duplicate key race conditions during parallel module imports or multi-container startup.

## 2. CLI and LangGraph Studio Compatibility
- **Export Compiled Instance**: Always export the compiled graph instance directly under the name referenced in `langgraph.json` (e.g., `export const appGraph = workflow.compile(...)`).
- **Getter Compatibility**: If Express routes require an async getter, provide `export const getAppGraph = async () => appGraph;` alongside the direct export. Do not only export the getter.

## 3. SSE Stream Processing & Filtering
- **Node Filtering**: When consuming `streamEvents` (v2) in Express/SSE handlers, do not forward all `on_chat_model_stream` events blindly to the client.
- **Avoid Token Leakage**: Filter model stream events by the originating node name using `event.metadata?.langgraph_node === 'generate'`. This prevents internal tokens (e.g., from query rewriters or query expansion LLM calls) from leaking into the final answer chat window.
- **Fallback Answers**: Only set streaming trackers (like `tokensStreamed`) when tokens are successfully sent from the final generation node. This ensures that static fallback answers (when the LLM is skipped due to 0 retrieved docs) are correctly written during the `on_chain_end` phase.

## 4. Long-Running Workflows
- **Asynchronous Execution**: Any long-running workflow (like document ingestion or complex agentic reasoning) must not block the main Express HTTP thread.
- **Queueing Strategy**: Push the task to a background queue (e.g., BullMQ backed by Redis) configured with automatic retries and exponential backoff.
- **Status Tracking & Error Transitions**: Store granular statuses in the PostgreSQL database so the frontend can poll for progress (e.g., `queued`, `processing...`, `done`). Worker jobs and graph handlers must catch unhandled exceptions and explicitly update the database status to `'error'` to prevent documents from remaining stuck in intermediate states (e.g. `'chunking and saving...'`).
- **Vector Idempotency on Retries**: When re-chunking or retrying vector embeddings for a document, always purge existing vector chunks for that document (`DELETE FROM documents WHERE metadata->>'file_id' = $1`) before saving new chunks into pgvector.
- **OBAC Tag Governance**: Document tags for Object-Based Access Control (OBAC) should strictly select from pre-registered tags managed by administrators. Untagged documents are public and accessible to all authenticated users.

## 5. State Annotations & Sentinels
- **Strict State Typing**: For StateGraph channels that represent filters or permissions (e.g. `allowedTagIds: Annotation<string[]>`), avoid passing `undefined` to denote unrestricted access. Use an explicit sentinel value (e.g. `['*']`) or an empty array `[]` so that LangGraph's state invariant validation passes consistently.

