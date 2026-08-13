# Frontend Architecture Standards

When developing or refactoring the Next.js frontend application, always adhere to the following standards:

1. **Feature-Based Architecture**: Organize code by feature domains (e.g., `src/features/chat`, `src/features/ingestion`) rather than by technical roles. Each feature should contain its own `components`, `hooks`, `store`, and `utils`.
2. **State Management**: Use **Zustand** for global and complex UI state instead of lifting `useState` or using React Context unnecessarily. Store files should be named `use<Feature>Store.ts`.
3. **Data Fetching**: Use **SWR** (`swr`) for client-side data fetching, mutation, and polling. Avoid using native `fetch` inside `useEffect` or `setInterval` for polling.
4. **Separation of Concerns (Thin Wrappers)**: Page components (`src/app/**/page.tsx`) must act strictly as thin orchestrators. They should compose smaller feature components and pass down state, rather than containing massive UI trees.
5. **Logic Extraction**: Pure, non-React logic (e.g., complex regex, data transformations, math) must be extracted into `src/features/<feature>/utils/` to keep components clean and testable.
6. **Component Granularity**: Large monolithic UI files must be aggressively broken down into logical sub-components within `src/features/<feature>/components/`. If a component handles multiple distinct visual areas (e.g., a Sidebar and Tabs), split them up.
