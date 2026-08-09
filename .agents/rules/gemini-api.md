# Gemini API & Embeddings

When working with `@langchain/google-genai` or the Google Generative AI SDK for embeddings:
- If a `404 Not Found` error occurs indicating the embedding model (e.g., `text-embedding-004` or `embedding-001`) is not found, **do not** randomly guess other model names.
- Different API keys have access to different model aliases (e.g., `gemini-embedding-2`, `gemini-embedding-001`).
- **Immediately** run a script to query `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}` and filter for `supportedGenerationMethods.includes('embedContent')` to find the exact model names provisioned for that key.
- Update the code to use the newest model returned by that query (e.g., `gemini-embedding-2`).

# Docker Compose Guidelines

When working with Docker Compose in this project:

1. **Service Networking**: Never use `localhost` for communication between containers. Always use the exact service name defined in `docker-compose.yml` (e.g., `pgvector`, `docling-service`) as the hostname.
2. **Default Networks**: Do not explicitly define custom networks in `docker-compose.yml` unless strictly required for complex isolation. Rely on Docker Compose's default network.
3. **Environment Variables**: Prefer defining application environment variables directly in the `docker-compose.yml` file under the service's `environment:` block rather than relying solely on local `.env` files, ensuring values like `DB_HOST` correctly point to docker service names.

# Podman & macOS Resource Guidelines

When running this stack on macOS utilizing Podman instead of Docker:

1. **Disk Capacity Needs**: Docling's dependencies (PyTorch, transformers, CUDA) are very large. The default 25GB Podman VM partition will run out of disk space during build (`No space left on device`). Allocate at least **150 GB** of virtual disk space.
2. **Apple Hypervisor Preference**: Avoid the default `libkrun` VM provider as it crashes (`krunkit exited unexpectedly with exit code 2`) during disk resize operations. Initialize the VM utilizing the native `applehv` provider instead.
3. **VM Initialization Sequence**:
   To initialize a clean machine with adequate size, execute:
   ```bash
   podman machine stop
   podman machine rm --force
   podman machine init --provider applehv --disk-size 150
   podman machine start
   ```
