You are tasked with refactoring the `resource-mapper` project to introduce a new graph rendering engine (`@maxgraph/core`) alongside the existing one (`@xyflow/svelte`). The goal is to support both engines side-by-side with a runtime toggle, while decoupling the core graph logic from any specific UI library.

Follow these instructions precisely. Do not remove `elkjs` or `libavoid-js`. Do not remove `@xyflow/svelte`.

### **Phase 1: Dependencies & Configuration**

1.  **Modify `packages/core/package.json`**:
    *   Add `"@maxgraph/core": "^0.6.0"` (or latest stable) to `dependencies`.

### **Phase 2: Decoupled Type System**

2.  **Modify `packages/shared/src/flow-types.ts`**:
    *   Remove the import of `Edge` and `Node` from `@xyflow/svelte`.
    *   Define generic interfaces that mirror the structure used by Svelte Flow but are creating a neutral contract:
        ```typescript
        export interface GraphNode<T = any> {
            id: string;
            position: { x: number; y: number };
            data: T;
            type?: string;
            width?: number;
            height?: number;
            parentId?: string;
            hidden?: boolean;
            [key: string]: any;
        }

        export interface GraphEdge<T = any> {
            id: string;
            source: string;
            target: string;
            data?: T;
            type?: string;
            label?: string; // specific visual label
            sourceHandle?: string | null;
            targetHandle?: string | null;
            hidden?: boolean;
            [key: string]: any;
        }
        ```
    *   Update `FlowGraphInput` and any other types in this file to use `GraphNode` and `GraphEdge` instead of the imported Svelte Flow types.

3.  **Refactor Graph Generators**:
    *   **Modify `packages/core/src/lib/utils/flow/groupOverviewGraph.ts`**:
        *   Remove imports from `@xyflow/svelte`.
        *   Import `GraphNode`, `GraphEdge` from `$shared/flow-types`.
        *   Update functions to return these generic types.
    *   **Modify `packages/core/src/lib/utils/flow/servicesGraph.ts`**:
        *   Remove imports from `@xyflow/svelte`.
        *   Import `GraphNode`, `GraphEdge` from `$shared/flow-types`.
        *   Update functions to return these generic types.
    *   **Modify `packages/core/src/lib/utils/flow/layout.ts`**:
        *   Remove imports from `@xyflow/svelte`.
        *   Import `GraphNode`, `GraphEdge` from `$shared/flow-types`.
        *   Update the layout logic to accept these generic types. (Note: The structure is compatible, so logic changes should be minimal).

### **Phase 3: State Management & Settings**

4.  **Create `packages/core/src/lib/state/settings.svelte.ts`**:
    *   Create a simple global setting using Svelte 5 runes:
        ```typescript
        export const settings = $state({
            renderer: 'svelteflow' as 'svelteflow' | 'maxgraph'
        });
        ```
    *   Add a helper function to toggle or set the renderer.

5.  **Modify `packages/core/src/lib/components/Header.svelte`**:
    *   Add a simple button or select input in the header that binds to `settings.renderer`.
    *   Label it "Switch Renderer".

### **Phase 4: Component Architecture**

6.  **Rename & Refactor Existing Canvas**:
    *   **Rename** `packages/core/src/lib/components/FlowCanvas.svelte` to `packages/core/src/lib/components/SvelteFlowCanvas.svelte`.
    *   **Update** this file to import `GraphNode`, `GraphEdge` from `$shared/flow-types` instead of `@xyflow/svelte` (for the props).
    *   *Interpretation Note*: The internal state (`nodes`, `edges`) will still need to be typed as Svelte Flow types for the `<SvelteFlow />` component to accept them. Cast the generic props to Svelte Flow types if necessary inside the component or use `as any` where strict type overlap fails, but keep the external API generic.

7.  **Create New MaxGraph Canvas**:
    *   **Create `packages/core/src/lib/components/MaxGraphCanvas.svelte`**:
    *   **Props**: Same as `SvelteFlowCanvas` (`graph`, `pending`, `onnodeDoubleClick`).
    *   **Logic**:
        *   Import `Graph`, `InternalEvent`, `RubberBandHandler`, `HierarchicalLayout` from `@maxgraph/core`.
        *   On `onMount`, initialize a `new Graph(container)`.
        *   Configure simple styles for 'service', 'mainGroup', 'serviceGroup' (use basic rectangles/colors for now).
        *   Implement a reactive effect (`$effect`) that runs when the `graph` prop changes:
            *   Clear the graph model.
            *   Convert `graph.nodes` and `graph.edges` into `maxgraph` vertices and edges.
            *   Run a `HierarchicalLayout` (or `FastOrganicLayout`) to position them (ignore the x/y from the props for now, let MaxGraph layout it).
        *   Bind double-click events to the `onnodeDoubleClick` prop.
        *   Ensure proper cleanup in `onDestroy` (destroy graph instance).

8.  **Create Wrapper Canvas**:
    *   **Create `packages/core/src/lib/components/FlowCanvas.svelte`**:
    *   **Props**: Same as before (`graph`, `pending`, `onnodeDoubleClick`).
    *   **Logic**:
        *   Import `settings` from `$lib/state/settings.svelte`.
        *   Import `SvelteFlowCanvas` and `MaxGraphCanvas`.
        *   Use an `{#if settings.renderer === 'svelteflow'} ... {:else} ... {/if}` block to render the appropriate component.
        *   Pass all props down.

### **Phase 5: Cleanup & Exports**

9.  **Modify `packages/core/src/lib/components/index.ts`**:
    *   Export `SvelteFlowCanvas`.
    *   Export `MaxGraphCanvas`.
    *   Ensure `FlowCanvas` is still exported as default (it is the wrapper now).

10. **Global Styles**:
    *   Keep `@import '@xyflow/svelte/dist/style.css';` in `app.css` for now, as we are keeping Svelte Flow alive.

