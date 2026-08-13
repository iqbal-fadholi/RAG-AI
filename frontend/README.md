This is a [Next.js](https://nextjs.org) frontend application for RAG.ai.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture & Best Practices

This project strictly follows a feature-based architecture to maintain scalability and clean separation of concerns.

### 1. Feature-Based Structure
All domain logic and components are encapsulated within `src/features/`. For example, the `chat` and `ingestion` domains have their own `components`, `store`, and `hooks` folders.

### 2. State Management (Zustand)
We use **Zustand** for managing complex, cross-component UI state. Stores are located within their respective feature directories (e.g., `src/features/chat/store/useChatStore.ts`).

### 3. Data Fetching (SWR)
Client-side data fetching and polling is handled via **SWR**. Custom hooks (e.g., `useDocuments.ts`) wrap SWR calls to keep components clean and automatically manage caching, revalidation, and loading states.

### 4. Component Granularity & Thin Pages
Next.js page components (`src/app/**/page.tsx`) should serve strictly as **thin orchestrators**. They compose smaller, highly-focused components and pass down state.
Large UI sections (like sidebars, tabs, or complex forms) must be extracted into their own files within `src/features/<feature>/components/`.

### 5. Pure Logic Extraction
To maintain clean React components, complex pure logic (e.g., regex matching, complex data transformations) should be extracted into `src/features/<feature>/utils/`.
