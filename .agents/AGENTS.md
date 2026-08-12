# LangGraph Project Guidelines

Follow these guidelines when building and exposing LangGraph workflows in this workspace:

## 1. Graph Compilation and Checkpointing Lifecycle
- **Compile Once**: Compile the `StateGraph` workflow once at the module level rather than inside HTTP request handlers or dynamically on every request.
- **Async Setup**: Do not invoke `checkpointer.setup()` or table migrations synchronously inside route handlers. Perform checkpointer database initialization asynchronously in the background at module load (e.g., via an IIFE in the graph file) or during application bootstrap. This prevents connection pool exhaustion and database locks.

## 2. CLI and LangGraph Studio Compatibility
- **Export Compiled Instance**: Always export the compiled graph instance directly under the name referenced in `langgraph.json` (e.g., `export const appGraph = workflow.compile(...)`).
- **Getter Compatibility**: If Express routes require an async getter, provide `export const getAppGraph = async () => appGraph;` alongside the direct export. Do not only export the getter.

## 3. SSE Stream Processing & Filtering
- **Node Filtering**: When consuming `streamEvents` (v2) in Express/SSE handlers, do not forward all `on_chat_model_stream` events blindly to the client.
- **Avoid Token Leakage**: Filter model stream events by the originating node name using `event.metadata?.langgraph_node === 'generate'`. This prevents internal tokens (e.g., from query rewriters or query expansion LLM calls) from leaking into the final answer chat window.
- **Fallback Answers**: Only set streaming trackers (like `tokensStreamed`) when tokens are successfully sent from the final generation node. This ensures that static fallback answers (when the LLM is skipped due to 0 retrieved docs) are correctly written during the `on_chain_end` phase.

## 4. Long-Running Workflows
- **Asynchronous Execution**: Any long-running workflow (like document ingestion or complex agentic reasoning) must not block the main Express HTTP thread.
- **Queueing Strategy**: Push the task to a background queue (e.g., BullMQ backed by Redis).
- **Status Tracking**: Store granular statuses in the PostgreSQL database so the frontend can poll for progress (e.g., `queued`, `processing...`, `done`), allowing system resilience and UI responsiveness.
