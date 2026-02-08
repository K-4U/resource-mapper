# Svelte Migration Plan

## 1. Objectives
- Replace the Nuxt/Vuetify frontend with a Svelte-based implementation (SvelteKit recommended for routing + tooling).
- Preserve the existing data layer (YAML files, validation helpers, service classes, composables) with minimal surface changes.
- Deliver feature parity for the overview and group detail experiences, including toolbar, diagrams, sidebars, and team contact cards.
- Keep the codebase deployable as a static bundle backed only by the generated YAML data (no runtime API).

## 2. Non-Goals / Out of Scope
- Changing the YAML schema, validation logic, or data directories.
- Introducing a backend or server-side API.
- Rewriting diagrams/logic in a different visualization library (Mermaid stays).
- Reworking the Java backend or Maven modules.

## 3. Current Architecture Snapshot (from `ARCHITECTURE.md`)
- **Data ingestion**: `YamlEntityService` subclasses load YAML via `import.meta.glob` and validate through `frontend/types.ts`.
- **Business logic**: Services for groups, services, teams, and derived connections.
- **Presentation**: Nuxt pages (`index.vue`, `group.vue`) using Vuetify components, FlowCanvas, and toolbars.
- **Routing**: Two primary routes (`/`, `/group?groupId=...`).
- **Testing**: Vitest suites covering data services, composables, and diagram utilities.

## 4. Target Architecture (Svelte)
- **Framework**: SvelteKit for file-based routing, SSR-disabled static export (matches current hosting constraint).
- **Styling/UI**: Lightweight component styling via Tailwind or custom CSS modules; no Vuetify dependency.
- **State/data**: Reuse existing TypeScript services/composables as plain modules, exposing async functions or Svelte stores.
- **Diagram rendering**: Wrap `vue-mermaid-string` equivalent in Svelte (likely `svelte-mermaid` or direct Mermaid integration) to keep FlowCanvas-like functionality.
- **Routing parity**: `/` (overview) and `/group/[id]` (dynamic route) generated statically.
- **Dev workflow**: Use SvelteKit’s `npm run dev -- --open` hot-reload server during development while retaining fully static build output for deployment.

## 5. Migration Strategy
1. **Scaffold SvelteKit**
   - Create a new `frontend-sveltekit/` directory via `npm create svelte@latest frontend-sveltekit` and leave the current `frontend/` (Nuxt) folder untouched for reference until the migration is complete.
   - Configure TypeScript + ESLint + Prettier.
   - Enable `@sveltejs/adapter-static` for fully static generation (prerender all routes) while keeping the dev server for local hot reload.

2. **Port Shared Utilities**
   - Copy `frontend/types.ts`, services, and utilities into the Svelte project (adjusting import paths only).
   - Replace Vue-specific helpers (`useAsyncData`, `MaybeRef`) with Promise-based loaders or Svelte stores.

3. **Rebuild Data Access Layer**
   - Keep `YamlEntityService` logic; ensure Vite’s `import.meta.glob` works identically in SvelteKit.
   - Expose data-fetch functions (e.g., `loadGroups()`, `loadGroup(groupId)`).
   - Create derived stores/actions for connections similar to the Vue composables.

4. **Implement Pages**
   - `/+page.svelte`: Overview route rendering the diagram + Group detail sidebar.
   - `/group/[groupId]/+page.svelte`: Group detail route showing FlowCanvas + Service sidebar.
   - Use `load` functions for data fetching to supply props to components; handle errors + empty states.

5. **Component Mapping**
   | Current Component | Svelte Replacement Plan |
   | --- | --- |
   | `FlowCanvas.vue` | `FlowCanvas.svelte` wrapping Mermaid directly, handling toolbar events + double-click detection. |
   | `DiagramToolbar.vue` | `DiagramToolbar.svelte` using Svelte components + icons (e.g., Heroicons). |
   | `GroupDetailSidebar.vue` | `GroupDetailSidebar.svelte` pulling data via props/stores. |
   | `ServiceDetailSidebar.vue` | `ServiceDetailSidebar.svelte` with expandable sections. |
   | `Legend.vue` | Simple Svelte component. |
   | `TeamContactCard.vue` | Svelte component using existing team service data. |
   | Loading/Error/Empty components | Reimplemented with Svelte + CSS. |

6. **Styling & Theming**
   - Decide on CSS approach (Tailwind, SCSS modules, or vanilla CSS).
   - Recreate light/dark toggle using Svelte stores + `localStorage` persistence.

7. **Testing & Tooling**
   - Continue using Vitest for services/utilities (shared TS files).
   - Add Svelte component tests via `@testing-library/svelte` if necessary.
   - Update package scripts for linting/test/build.

8. **Build & Deployment**
   - Configure `npm run build` to run SvelteKit static export.
   - Ensure output mirrors the current Nuxt static structure for hosting.

## 6. Open Questions / Decision Points
1. **Target directory** – ✅ Scaffold the SvelteKit app in a new `frontend-sveltekit/` directory so the existing `frontend/` remains available for reference until we officially switch over.
2. **Styling framework** – ✅ Use Tailwind CSS (SvelteKit template default) plus component-scoped styles where necessary.
3. **Mermaid integration** – ✅ Start with an existing Svelte wrapper (e.g., `svelte-mermaid`); drop down to direct Mermaid usage only if we hit limitations.
4. **Static vs. dev runtime** – ✅ Disable SSR and prerender everything via `adapter-static` so builds work from disk, but keep the SvelteKit dev server for local hot reload.
5. **Testing focus** – ✅ Prioritize data-layer parity first (reuse current Vitest suites); add Svelte component tests in a later phase once UI parity is stable.

## 7. Proposed Timeline / Phases
1. **Phase 0 – Confirmation**: Agree on open questions above.
2. **Phase 1 – Scaffold & Data Layer**: Set up SvelteKit, port services/types, verify unit tests pass.
3. **Phase 2 – Core Pages**: Build FlowCanvas + overview/group pages with placeholder layouts.
4. **Phase 3 – Finish Components**: Port sidebars, toolbars, loading/error states, theming.
5. **Phase 4 – Polish & QA**: Cross-browser testing, accessibility pass, documentation updates, final build verification.

## 8. Next Steps
- Review and confirm this plan (and open questions).
- Once approved, proceed with SvelteKit scaffolding and incremental migration following the phases outlined above.
