# LangChain pgvector Table Naming

When working with Postgres and `@langchain/community/vectorstores/pgvector`:
- **DO NOT** create custom tables named `documents` for tracking app state or metadata. 
- LangChain defaults to creating a table named `documents` to store its embeddings and vector chunks. Creating a separate tracking table with the same name will cause a collision.
- Use explicit, alternative table names like `uploaded_files` or `file_registry` for tracking uploads.
