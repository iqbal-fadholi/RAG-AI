---
name: nextjs-sandbox-builds
description: Handle Next.js build errors related to Turbopack or port restrictions in the sandbox.
---

# Next.js Sandbox Restrictions

When working with Next.js applications in this environment:
- Be aware that `next build` may fail with `TurbopackInternalError` or `os error 1` due to sandbox restrictions on port binding.
- If this occurs, do not attempt to bypass the sandbox just to run the build. Instead, either acknowledge the error and skip the validation build (relying on your code intelligence), or configure Next.js to fall back to Webpack completely if a build artifact is strictly required.
- Do not let this error block the completion of frontend implementation tasks.
