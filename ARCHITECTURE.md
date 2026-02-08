# Resource Mapper Architecture

## System Overview
Resource Mapper is a fully static Nuxt 3 + Vuetify application that turns YAML-defined service landscapes into interactive diagrams. All domain data is stored under `frontend/public/` (`services/**`, `teams/**`). During build time Vite’s `import.meta.glob` eagerly inlines these YAML files, so the browser loads structured data without depending on any runtime API. The generated bundle is pure HTML/CSS/JS plus static assets, deployable to any CDN or object store.

## Data Flow
1. **YAML ingestion** – Each entity loader subclasses `YamlEntityService`, which receives the globbed file map, normalizes paths, and indexes entries by identifier.
2. **Parsing & validation** – Loaders parse YAML via `js-yaml` and run it through the validators in `frontend/types.ts` (`validateServiceDefinition`, `validateGroupInfo`, `validateTeam`, etc.). Invalid files throw descriptive errors early.
3. **Enrichment** – `ServicesService` annotates records with derived identifiers, group names, and a computed `incomingConnections` array. `ConnectionsService` derives adjacency lists and aggregated group-to-group counts.
4. **Composable access layer** – Vue composables (`useGroups`, `useServices`, `useConnections`, `useTeams`, …) call the services through `useAsyncData`, providing consistent `pending`, `error`, and `refresh` state to pages and components.
5. **Presentation** – Pages convert the fetched data into Mermaid definitions via helpers in `frontend/utils/mermaid/**` (`buildGroupOverviewDiagram`, `buildGroupServicesDiagram`). `FlowCanvas` renders the diagrams with `vue-mermaid-string`, while toolbars and sidebars coordinate selection, navigation, and detail panels.

## Domain Types & Validation (`frontend/types.ts`)
- Enumerations such as `ConnectionType` and `ServiceType` mirror the legacy Spring Boot models to keep YAML compatible across backends.
- Interfaces (`ServiceDefinition`, `GroupInfo`, `Team`, `ServiceConnection`, etc.) describe the normalized data that the composables and components consume.
- Helpers (`parseServiceIdentifier`, `validateServiceDefinition`, `validateGroupInfo`, `validateTeam`) sanitize YAML input, prevent legacy brace identifiers, and ensure connection arrays are well-formed.
- Tests: `frontend/tests/typesValidation.spec.ts` covers identifier parsing, enum validation, and outgoing connection rules; `frontend/tests/ServicesService.spec.ts` (see below) ensures these constraints hold once YAML is wired through the loaders.

## Data Access Services
### `YamlEntityService`
Abstract base that normalizes the raw glob files, extracts entity IDs, caches parsed results, and exposes `setFileMocks` for Vitest suites.

### `ResourceService` (`frontend/services/ResourceService.ts`)
- Loads each `group-info.yaml` to produce `GroupInfo` objects keyed by folder name.
- Used by group lookups, detail sidebars, and external connection summaries.

### `ServicesService` (`frontend/services/ServicesService.ts`)
- Loads every service YAML (excluding `group-info.yaml`).
- Validates outgoing connections, populates `incomingConnections`, and offers helper queries: `getService`, `getServicesByGroup`, `getAllServices`, `getExternalServicesForGroup`.
- `getExternalServicesForGroup` stitches in remote group metadata via `ResourceService` and tags entries as `incoming` or `outgoing` for diagram coloring.
- Tested in `frontend/tests/ServicesService.spec.ts` (parsing, grouping, incoming link derivation, legacy identifier rejection, external resolution).

### `TeamsService` (`frontend/services/TeamsService.ts`)
- Reads `frontend/public/teams/*.yaml`, validates with `validateTeam`, and exposes team maps for sidebars/contact cards.

### `ConnectionsService` (`frontend/services/ConnectionsService.ts`)
- Consumes `ServicesService` output to build:
  - `connectionsFromService` / `connectionsToService` maps keyed by `group/service`.
  - `servicesByGroup` sets for rapid per-group filtering.
  - `groupConnectionCounts` summarizing total edges between groups.
- Powers every `useConnections*` composable so both overview and detail diagrams share identical graph data.

## Composables & Data Fetching
| Composable | Responsibility |
| --- | --- |
| `useGroups`, `useGroup` | Fetch all groups or a single group. |
| `useServices`, `useService` | Fetch every service in a group or a single service definition. |
| `useExternalServicesForGroup` | Return external groups/services interacting with the current group, annotated with direction. |
| `useConnectionsFromService` / `useConnectionsToService` | Provide outgoing/incoming `ServiceConnection` arrays for a service node. |
| `useConnectionsFromGroup` / `useConnectionsToGroup` | Same as above but aggregated at group level. |
| `useServiceConnections`, `useGroupConnectionsSummary` | Convenience wrappers returning `{ from, to }` payloads. |
| `useAllGroupConnections` | Summarize all group-to-group edges (toggle self-connections). |
| `useTeams`, `useTeam` | Surface responsible team metadata for the contact cards. |

All composables rely on `useAsyncData`, so every consumer receives reactive `data`, `pending`, `error`, and `refresh` handles.

## Pages & Interactions
### Overview Page (`frontend/pages/index.vue`)
- Fetches all groups plus the aggregated group connections.
- `buildGroupOverviewDiagram` produces a Mermaid diagram and a node→group map.
- Layout: `FlowCanvas` (diagram), `GroupDetailSidebar` (metadata). Clicking nodes updates the sidebar; double-clicking routes to `/group?groupId=<id>`.
- `FlowCanvas` embeds `DiagramToolbar` so users can toggle the legend, switch dark mode, and log the diagram for debugging.

### Group Detail Page (`frontend/pages/group.vue`)
- Reads `groupId` from the query string, handling missing IDs via `ErrorDisplay`.
- Fetches: all groups (metadata), the group’s services, and external connections.
- `buildGroupServicesDiagram` merges internal/external services into one diagram; node IDs are mapped to either internal service definitions or `{ service, group }` tuples for external nodes.
- `ServiceDetailSidebar` shows group info, selected service details, AWS service type, and the owning team (internal or external). A home button (toolbar) navigates back to `/`; double-clicking an external node drills into that group, keeping both pages connected.

### Shared Interaction Pattern
- `FlowCanvas` standardizes toolbar actions, legend visibility, dark-mode persistence, and double-click detection.
- Sidebars subscribe to `nodeClick` events rather than reading diagram state directly, so both pages share the same interaction contract.

## Components
| Component | Responsibility |
| --- | --- |
| `FlowCanvas.vue` | Renders Mermaid diagrams, wires toolbar events (home, back, legend, dark mode, connection filters), handles double-click detection, and lazily loads icons. |
| `DiagramToolbar.vue` | Vuetify toolbar showing navigation buttons, legend toggle, dark-mode switch, and a “log diagram” action. |
| `GroupDetailSidebar.vue` | Displays metadata and responsible team for the selected group; shows a placeholder when nothing is selected. |
| `ServiceDetailSidebar.vue` | Presents the current group summary, selected service details, external target group info, and team contacts; supports clearing the selection. |
| `Legend.vue` | Static legend explaining node and edge colors; floats over the diagram when toggled on. |
| `TeamContactCard.vue` | Resolves team info via `useTeams`, renders reachability channels with icons/links, and can appear standalone or inside other components. |
| `LoadingSpinner.vue` | Full-screen indicator with customizable message, used while composables are pending. |
| `EmptyState.vue` | Generic “nothing to show” card with optional action button. |
| `ErrorDisplay.vue` | Rich error presentation with checklist hints, expandable technical details, retry/back buttons, and clipboard copy. |
| `AwsServiceIcon.vue` | Maps `ServiceType` enum values to AWS SVG assets in `public/icons/aws`, falling back to text when an icon fails to load. |

(Components not listed here: TODO — document them when functionality is clarified.)

## Testing Notes
- `frontend/tests/typesValidation.spec.ts` ensures the validation helpers reject malformed identifiers, arrays, and enums.
- `frontend/tests/ServicesService.spec.ts` covers service parsing, per-group retrieval, incoming connection enrichment, error handling for legacy identifier formats, and the external service resolver.
- Additional suites (e.g., `frontend/tests/useConnections.spec.ts`, diagram builders) exercise composables and utility layers to protect the YAML→diagram pipeline.

## Future Considerations
1. Add schema validation (JSON Schema or Zod) for richer editor diagnostics and faster feedback when YAML breaks the contract.
2. Wire the toolbar’s `toggleIncomingConnections` / `toggleExternalToExternal` events into the diagram builders so users can filter edges at runtime.
3. Create dedicated tests for `ConnectionsService` aggregation to catch regressions in group-level counts.
4. Document or script icon updates (`frontend/scripts/download-aws-icons.js`) to keep AWS assets in sync.

