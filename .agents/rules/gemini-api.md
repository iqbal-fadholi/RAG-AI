# Gemini API & Embeddings

When working with `@langchain/google-genai` or the Google Generative AI SDK for embeddings:
- If a `404 Not Found` error occurs indicating the embedding model (e.g., `text-embedding-004` or `embedding-001`) is not found, **do not** randomly guess other model names.
- Different API keys have access to different model aliases (e.g., `gemini-embedding-2`, `gemini-embedding-001`).
- **Immediately** run a script to query `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}` and filter for `supportedGenerationMethods.includes('embedContent')` to find the exact model names provisioned for that key.
- Update the code to use the newest model returned by that query (e.g., `gemini-embedding-2`).
