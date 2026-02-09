## Prompt: Migrate FlowCanvas from Mermaid to @xyflow/svelte with ELK Layout

You are upgrading the Resource Mapper frontend so that the existing Mermaid-powered `FlowCanvas` renders its diagrams with [`@xyflow/svelte`](https://xyflow.com/docs/svelte). The YAML-backed data layer, existing composables (e.g. `buildGroupOverviewDiagram`, `buildGroupServicesDiagram`), and routing logic must remain intact. Only the visualisation layer should change. Follow the guidance below step by step.

---
### 1. Objectives & Constraints
1. **Svelte-only scope**: All work happens inside `frontend-sveltekit` (FlowCanvas, diagram helpers, components). The Spring Boot backend and other folders stay untouched.
2. **Preserve services/data**: Keep everything under `/src/lib/services` and `types.ts` untouched; diagram builders may change but must still consume the same data.
3. **Keep interactions**: The current click/double-click events and `goHome` behaviour must keep triggering the existing routing logic (`nodeClick`, `nodeDoubleClick`, `goHome`).
4. **Custom node visuals**: Replace basic nodes with reusable Svelte Flow node components that always render AWS icons from the existing icon set (fallback styling allowed, but no new icon sources yet).
5. **Use SvelteFlow’s ELK integration**: Leverage the official @xyflow/svelte ELK helpers (instead of rolling elkjs manually) to compute layout; avoid hard-coded coordinates.
6. **Minimal view changes**: `routes/+page.svelte` and `routes/group/[groupId]/+page.svelte` should keep their data prep logic; adapt only the props that feed the new Flow layer.
7. **Edge labels visible**: Preserve connection labels by default; later we will add controls to hide them.
8. **Drag constraints**: Users should not be able to drag nodes outside their owning group/subgraph; use SvelteFlow features (e.g., `nodeExtent` or custom guards) to enforce this.
9. **Layout recompute**: Recalculate ELK layout on every load/render for now; caching can come later.

---
### 2. High-level Migration Plan
1. **Audit current FlowCanvas**
   - Document the props (`diagram`, `label`, `pending`, etc.), emitted events, and toolbar/legend composition.
   - Identify where Mermaid receives its string definition versus when the view decides there is “diagram content”.
2. **Define Flow data contracts**
   - Update `buildGroupOverviewDiagram` and `buildGroupServicesDiagram` (or add adjacent helpers) so they emit structured data for @xyflow directly before stringifying.
   - Preserve the node IDs so click handlers can still map to group/service IDs without extra translation.
3. **Introduce layout step**
   - Install `@xyflow/svelte`’s ELK integration package (it bundles elkjs) and build a helper `layoutWithElk(nodes, edges, options)` that returns positioned nodes/edges.
   - Store layout metadata alongside the Flow data so rerenders do not recompute unless the signature changes (mirrors old `dataSignature`).
4. **Build custom Flow components**
   - Implement `CustomGroupNode.svelte` and `CustomServiceNode.svelte` rendered via @xyflow node types.
   - Each node should accept `data` with `label`, `subLabel`, `iconPath` (loaded via existing AWS icon map), and emit `on:click`/`on:dblclick` events back to FlowCanvas.
5. **Replace FlowCanvas internals**
   - Remove Mermaid setup/rendering.
   - Mount `<SvelteFlow>` with controlled `nodes`, `edges`, `nodeTypes`, `edgeTypes`, `fitView`, and toolbar overlays (legend, buttons) identical to today’s UX.
   - Wire Flow’s `on:nodeClick`/`on:nodeDoubleClick` to dispatch the existing events.
6. **Legend & Toolbar parity**
   - Keep `DiagramToolbar.svelte` and `Legend.svelte` as overlays; only adjust styling if Flow’s container demands it.
7. **Testing & validation**
   - Update/group tests (Playwright + vitest) to account for DOM changes (SVG replaced by Flow). Focus on:
     - Initial render showing nodes.
     - Clicking nodes updates `GroupDetailSidebar`.
     - Double-click navigation still triggers `goto`.
     - Layout stability (no zero-height canvas).

---
### 3. Detailed Implementation Steps
1. **Dependencies**
   - `npm install @xyflow/svelte @xyflow/elk-layout elkjs` (or whichever integration package XYFlow documents for Svelte).
2. **Data conversion layer**
   - Refactor `buildGroupOverviewDiagram` and `buildGroupServicesDiagram` to expose structured Flow data before they stringify to Mermaid.
   - Output shape:
     ```ts
     type FlowGraph = {
       nodes: Array<{
         id: string
         type: 'group' | 'service' | 'external'
         data: {
           title: string
           subtitle?: string
           iconPath?: string
           status?: 'primary' | 'secondary'
         }
       }>
       edges: Array<{ id: string; source: string; target: string; data?: { label?: string } }>
     }
     ```
3. **ELK integration**
   - Use @xyflow/svelte’s ELK layout helpers (e.g., `createLayoutFlow` with `elkLayout` plugin) to run the layered algorithm with spacing similar to Mermaid (~80px horizontal / 60px vertical).
   - Return nodes with `position: { x, y }` and edges with `points` + `data.label` for edge captions.
4. **FlowCanvas rewrite**
   - Maintain props & events.
   - Internally:
     - Compute `flowGraph` via the updated builders + ELK layout (re-run on each load).
     - Pass to `<SvelteFlow nodes={nodes} edges={edges} nodeTypes={...} edgeTypes={...} fitView>` and configure drag constraints so nodes stay inside their parent group region.
     - Use `viewport.fitView()` on mount + when graph changes.
     - Preserve loading/empty/error states.
5. **Custom node components**
   - Register `nodeTypes={ group: GroupNode, service: ServiceNode, external: ExternalNode }`.
   - Each component should:
     - Display the AWS/service icon from the existing icon set (fallback circle/text if icon missing) plus text labels.
     - Emit `nodeclick` (single) and `nodedoubleclick` so FlowCanvas can dispatch the existing events.
     - Highlight selection states if FlowFlow exposes selection.
6. **Event plumbing**
   - Map Flow’s `on:nodeClick` event payloads back to the original node IDs so `nodeGroupMap` and `serviceNodeLookup` continue working without changes.
   - Ensure double-click detection either uses Flow’s built-in `on:nodeDoubleClick` or replicate the timer logic currently in FlowCanvas.
7. **Legend updates**
   - Adjust legend icons/colors if Flow’s visuals differ; keep semantics identical (Group, Service, External, Connection types).
8. **Styling**
   - Keep the Flow container full-height, reusing the `min-h-0` fixes already in place.
   - Match the dark theme colors from the Mermaid version for continuity.
9. **Testing strategy**
   - Unit: add tests around the conversion + layout helpers (mock ELK output).
   - E2E: update Playwright tests to target Flow nodes (`[data-id="group-api"]` etc.) instead of mermaid `.node` selectors.

---
### 4. Deliverables Checklist
- [ ] New helper(s) for Flow graph generation + ELK layout (using XYFlow’s ELK integration).
- [ ] Rewritten `FlowCanvas.svelte` using @xyflow/svelte.
- [ ] Custom node components with icon support.
- [ ] Updated Playwright selectors & regression tests.
- [ ] Documentation (README snippet) explaining how to add new node types.

---
### 5. Open Questions for the Product Owner
*(All answered – kept here for historical context.)*
1. **Icon source**: Custom nodes must use the existing AWS icon set; add fallbacks only when icons are missing.
2. **Edge labels**: Keep them visible initially; we’ll add UI to toggle filters later.
3. **Interaction parity**: Besides click/double-click/goHome, ensure nodes cannot be dragged outside their group boundaries (use SvelteFlow constraints); other gestures can remain default.
4. **Layout persistence**: Recompute ELK layout on every load for now; caching will be a follow-up task.
