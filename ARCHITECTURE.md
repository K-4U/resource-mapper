# Resource Mapper Architecture

## System Overview
Resource Mapper is a fully static Svelte 5 + SvelteFlow application that turns YAML-defined service landscapes into interactive diagrams. All domain data is stored under `data/` (`services/**`, `teams/**`) at the project root. During build time Vite’s `import.meta.glob` eagerly inlines these YAML files, so the browser loads structured data without depending on any runtime API. The generated bundle is pure HTML/CSS/JS plus static assets, deployable to any CDN or object store.

## Data Flow
1. **YAML ingestion** – Each entity loader subclasses `YamlEntityService`, which receives the globbed file map, normalizes paths, and indexes entries by identifier.
2. **Parsing & validation** – Loaders parse YAML via `js-yaml` and run it through the validators in `src/lib/types.ts` (`validateServiceDefinition`, `validateGroupInfo`, `validateTeam`, etc.). Invalid files throw descriptive errors early.
3. **Enrichment** – `ServicesService` annotates records with derived identifiers, group names, and a computed `incomingConnections` array. `ConnectionsService` derives adjacency lists and aggregated group-to-group counts.
4. **Data access layer** – Svelte components access data through helper functions in `src/lib/data/*.ts` (`getGroups`, `getServicesByGroup`, `getConnections`, `getTeams`, …) which call the underlying services.
5. **Presentation** – Pages and components transform the fetched data into SvelteFlow-compatible nodes and edges via builders in `src/lib/utils/flow/**` (`buildGroupOverviewGraph`, `buildGroupServicesGraph`).
6. **Layout & Rendering** – `FlowCanvas.svelte` uses `layoutFlowGraph` (leveraging `elkjs`) to calculate node positions. `SvelteFlow` renders the interactive diagram with custom components for nodes and edges.

## Domain Types & Validation (`src/lib/types.ts`)
- Enumerations such as `ConnectionType` and `ServiceType` mirror the legacy Spring Boot models to keep YAML compatible across backends.
- Interfaces (`ServiceDefinition`, `GroupInfo`, `Team`, `ServiceConnection`, etc.) describe the normalized data that the services and components consume.
- Helpers (`parseServiceIdentifier`, `validateServiceDefinition`, `validateGroupInfo`, `validateTeam`) sanitize YAML input and ensure data integrity.
- Tests: `src/lib/services/__tests__/` covers validation rules and service logic.

## Data Access Services
### `YamlEntityService`
Abstract base that normalizes the raw glob files, extracts entity IDs, caches parsed results, and exposes mock capabilities for Vitest suites.

### `ResourceService` (`src/lib/services/GroupService.ts`)
- Loads each `group-info.yaml` to produce `GroupInfo` objects keyed by folder name.
- Used by group lookups and detail sidebars.

### `ServicesService` (`src/lib/services/ServicesService.ts`)
- Loads every service YAML (excluding `group-info.yaml`).
- Validates outgoing connections, populates `incomingConnections`, and offers helper queries: `getService`, `getServicesByGroup`, `getAllServices`, `getExternalServicesForGroup`.

### `TeamsService` (`src/lib/services/TeamsService.ts`)
- Reads `data/teams/*.yaml`, validates with `validateTeam`, and exposes team maps for sidebars/contact cards.

### `ConnectionsService` (`src/lib/services/ConnectionsService.ts`)
- Consumes `ServicesService` output to build group-level connection summaries.
- Powers the overview diagram's edges between groups.

## Data Fetching Helpers (`src/lib/data/*.ts`)
These modules provide a clean interface for SvelteKit `+page.ts` loaders or components to fetch domain data.

| Module | Responsibility |
| --- | --- |
| `groups.ts` | Fetch all groups or a single group metadata. |
| `services.ts` | Fetch services in a group or a single service definition; fetch external services. |
| `connections.ts` | Provide group-to-group connection summaries. |
| `teams.ts` | Surface team metadata for contact cards. |

## Pages & Interactions
### Overview Page (`src/routes/+page.svelte`)
- Fetches all groups plus the aggregated group connections via its `+page.ts` loader.
- `buildGroupOverviewGraph` produces a SvelteFlow-ready graph and a node→group map.
- Layout: `FlowCanvas` (diagram), `GroupDetailSidebar` (metadata). Double-clicking a group node routes to `/group/[groupId]`.

### Group Detail Page (`src/routes/group/[groupId]/+page.svelte`)
- Reads `groupId` from the route parameters.
- Fetches: group metadata, the group’s services, and external connections.
- `buildGroupServicesGraph` merges internal/external services into a single graph.
- `ServiceDetailSidebar` shows group info and selected service details. Double-clicking an external node drills into that group.

## Components
| Component | Responsibility |
| --- | --- |
| `FlowCanvas.svelte` | Orchestrates SvelteFlow, triggers ELK layout, and handles node/edge events. |
| `Header.svelte` | Top navigation bar with branding and links. |
| `GroupDetailSidebar.svelte` | Displays metadata and responsible team for the selected group. |
| `ServiceDetailSidebar.svelte` | Presents group summary and selected service details. |
| `Legend.svelte` | Explains node and edge colors; can be toggled via store state. |
| `TeamContactCard.svelte` | Renders team reachability channels with icons/links. |
| `LoadingSpinner.svelte` | Indicator shown while data or layout is pending. |
| `EmptyState.svelte` | Shown when no data is available for a diagram. |
| `ErrorDisplay.svelte` | Rich error presentation with retry/back buttons. |
| `ServiceNode.svelte`, `MainGroupNode.svelte` | Custom SvelteFlow node components for services and groups. |
| `SnakeEdge.svelte` | Custom SvelteFlow edge component using SVG paths for smooth connections. |

## State Management (`src/lib/stores/*.ts`)
- `diagram.ts`: Manages UI state like dark mode, legend visibility, and diagram logging actions.

## Future Considerations
1. Add schema validation (JSON Schema or Zod) for richer editor diagnostics.
2. Enhance ELK layout options to better handle extremely large service landscapes.
3. Implement persistent user preferences for layout and visibility toggles.
