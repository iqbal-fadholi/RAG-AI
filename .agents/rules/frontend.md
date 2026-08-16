# Frontend Architecture Standards

When developing or refactoring the Next.js frontend application, always adhere to the following standards:

1. **Feature-Based Architecture**: Organize code by feature domains (e.g., `src/features/chat`, `src/features/ingestion`) rather than by technical roles. Each feature should contain its own `components`, `hooks`, `store`, and `utils`.
2. **State Management**: Use **Zustand** for global and complex UI state instead of lifting `useState` or using React Context unnecessarily. Store files should be named `use<Feature>Store.ts`.
3. **Data Fetching**: Use **SWR** (`swr`) for client-side data fetching, mutation, and polling. Avoid using native `fetch` inside `useEffect` or `setInterval` for polling.
4. **Separation of Concerns (Thin Wrappers)**: Page components (`src/app/**/page.tsx`) must act strictly as thin orchestrators. They should compose smaller feature components and pass down state, rather than containing massive UI trees.
5. **Logic Extraction**: Pure, non-React logic (e.g., complex regex, data transformations, math) must be extracted into `src/features/<feature>/utils/` to keep components clean and testable.
6. **Component Granularity**: Large monolithic UI files must be aggressively broken down into logical sub-components within `src/features/<feature>/components/`. If a component handles multiple distinct visual areas (e.g., a Sidebar and Tabs), split them up.

## 7. Design System & Coloring Strategy

Always maintain consistent visual styling and color hierarchy across all pages (matching `/ingest` and `/admin`):

- **Background & Atmosphere**:
  - Global background: `radial-gradient(circle at top left, #231b42, #0d0a14 60%)` fixed.
  - Dialogs & modals: solid dark purple `#1a162b` or `#161224` with `border-outline-variant` and `backdrop-blur-md`.

- **Glassmorphism Panels (`glass-panel`)**:
  - Outer card containers: `glass-panel rounded-[2rem] overflow-hidden shadow-2xl`.
  - Header banner inside panels: `px-8 py-6 border-b border-outline-variant bg-surface-container-high/30`.
  - Sub-cards / nested tiles: `p-4 to p-6 rounded-2xl bg-surface-container-high/40 border border-outline-variant/40 hover:border-outline-variant transition-colors`.

- **Typography & Text Contrast**:
  - Page Headings: `font-headline-lg text-headline-lg text-white`
  - Section Headings: `font-headline-md text-headline-md text-white`
  - Primary text / labels: `text-white` or `text-on-surface` (`#e5e1ea`)
  - Muted / secondary text: `text-on-surface-variant` (`#a7a5b4`)
  - Accent / active text: `text-primary` (`#e2dcfc`)

- **Interactive Controls & Tab Bars**:
  - Tab Navigation Bar: `bg-surface-container-high/60 border border-outline-variant/30 p-1.5 rounded-xl backdrop-blur-sm`
  - Active Tab: `bg-surface-variant text-primary shadow-sm font-label-md`
  - Inactive Tab: `text-on-surface-variant hover:text-on-surface font-label-md`
  - Tab Count Badge: `px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium`

- **Inputs & Form Controls**:
  - Search / Text Inputs: `rounded-xl bg-surface-container-high/60 border border-outline-variant/40 text-on-surface font-body-sm placeholder-on-surface-variant/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 backdrop-blur-sm`
  - Select Dropdowns: `bg-surface-container-high/80 border border-outline-variant/50 text-on-surface text-xs rounded-xl px-3 py-1.5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20`

- **Buttons**:
  - Primary CTA: `action-button-primary px-6 py-2 rounded-xl font-label-md text-white shadow-md active:scale-95`
  - Secondary: `action-button-secondary px-5 py-2 rounded-xl font-label-md transition-colors`
  - Icon buttons: `p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors` (for delete: `hover:text-red-500 hover:bg-red-500/10`)

- **Status & Permission Badges**:
  - Primary / Role / Tag: `bg-primary/10 border border-primary/20 text-primary font-label-md text-[11px]`
  - Success / Done / Full Access: `bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-label-md text-[11px]`
  - Warning / System / Review: `bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-label-md text-[11px]`
  - Error / Destructive: `bg-red-500/10 border border-red-500/20 text-red-500 font-label-md text-[11px]`
  - Neutral / Queued: `bg-surface-variant border border-outline-variant text-on-surface font-label-md text-[11px]`

