---
name: stitch-ui-integration
description: Workflow for fetching and implementing UI designs from the Google Stitch MCP server.
---

# Google Stitch UI Integration Workflow

When a user asks to implement a design from Google Stitch, follow these exact steps:

1. **Locate the Project:** Use the `stitch` MCP server's `list_projects` tool to find the project ID matching the user's description.
2. **Locate the Screens:** Use the `list_screens` tool with the `projectId` to find the relevant screen IDs and their `htmlCode.downloadUrl`.
3. **Fetch the HTML:** Use the `read_url_content` tool to download the HTML from the `downloadUrl`. Do NOT attempt to guess the HTML structure.
4. **Extract Design Tokens:** The downloaded HTML will contain a `<script id="tailwind-config">` block. Extract this configuration and apply it directly to the project's `tailwind.config.js` or `globals.css` to perfectly match the requested design system (colors, fonts, spacing, glassmorphism).
5. **Implement Markup:** Translate the HTML structure into the target framework (e.g., React/Next.js) preserving the exact utility classes and layout.
