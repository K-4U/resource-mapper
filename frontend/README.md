# Resource Mapper Frontend

Modern Vue 3 application built with Nuxt 3, Vue Flow, and PrimeVue for visualizing service dependencies.

## Features

✅ **Vue Flow Integration** - Interactive, draggable graph visualization
✅ **Full CSS Control** - Complete styling customization with CSS variables
✅ **Group Support** - Visual grouping with attached labels
✅ **PrimeVue Components** - Modern UI components and theming
✅ **TypeScript** - Full type safety
✅ **Responsive** - Works on all modern browsers
✅ **REST API Integration** - Connects to Spring Boot backend via OpenAPI

## Tech Stack

- **Nuxt 3** - Vue framework with SSR/SPA capabilities
- **Vue Flow** - Interactive node-based graph library
- **PrimeVue** - UI component library with theming
- **TypeScript** - Type-safe development

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Spring Boot backend running on `http://localhost:8080`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Configuration

Configure the API endpoint in `.env`:

```env
API_BASE_URL=http://localhost:8080/api
```

Or set it in `nuxt.config.ts` under `runtimeConfig.public.apiBase`

## Project Structure

```
frontend/
├── app/
│   └── app.vue                 # Root application component
├── assets/
│   └── css/
│       └── main.css           # Global styles and CSS variables
├── components/
│   ├── Legend.vue             # Legend component
│   └── flow/                  # Custom Vue Flow node components
│       ├── GroupNode.vue
│       ├── ExternalGroupNode.vue
│       ├── ServiceNode.vue
│       ├── ExternalServiceNode.vue
│       └── GroupNodeItem.vue
├── composables/
│   └── useApi.ts              # API integration composable
├── pages/
│   ├── index.vue              # Overview page (all groups)
│   └── group/
│       └── [groupName].vue    # Group detail page
├── types/
│   └── api.ts                 # TypeScript type definitions
└── nuxt.config.ts             # Nuxt configuration
```

## Customization

### Theming

The application uses CSS variables for easy theming. Edit `assets/css/main.css`:

```css
:root {
  --group-internal-bg: rgba(227, 242, 253, 0.4);
  --group-internal-border: #1976d2;
  /* ... more variables */
}
```

### PrimeVue Theme

Change the PrimeVue theme in `nuxt.config.ts`:

```typescript
primevue: {
  options: {
    theme: 'aura', // or 'lara', 'nora', etc.
    ripple: true
  }
}
```

### Custom Nodes

Create new node types in `components/flow/` and register them in your pages:

```typescript
const nodeTypes = {
  'my-custom-node': markRaw(MyCustomNode)
}
```

## API Integration

The application expects the following REST endpoints from the Spring Boot backend:

- `GET /api/services` - Get all services grouped by group
- `GET /api/services/group/{groupName}` - Get services for a specific group
- `GET /api/groups` - Get all group information
- `GET /api/groups/{groupName}` - Get specific group information

## Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview

# Generate static site
npm run generate
```

## Features Breakdown

### Graph Visualization
- **Draggable nodes** - All nodes can be moved around
- **Zoom & Pan** - Built-in controls for navigation
- **MiniMap** - Overview of the entire graph
- **Smooth animations** - Edge animations for data flow

### Styling Control
- **CSS Variables** - Easy theme customization
- **Attached labels** - Labels positioned outside group boxes
- **Hover effects** - Interactive feedback
- **No overlaps** - Smart positioning with Vue Flow

### Navigation
- **Index page** - Overview of all groups with connections
- **Group pages** - Detailed view of services within a group
- **Click to navigate** - Click groups to drill down

## Development

### Adding a New Page

1. Create file in `pages/` directory
2. Use the composables for API calls
3. Import Vue Flow components as needed

### Adding a New Component

1. Create component in `components/`
2. Use TypeScript for props
3. Import automatically (Nuxt auto-imports)

## Troubleshooting

### API Connection Issues

Make sure your Spring Boot backend is running and CORS is enabled:

```java
@CrossOrigin(origins = "http://localhost:3000")
```

### Node Overlap

Adjust positioning logic in the pages or use Vue Flow's built-in layout algorithms.

## Future Enhancements

- [ ] Dark mode support
- [ ] Export graph as image
- [ ] Real-time updates via WebSocket
- [ ] Advanced filtering and search
- [ ] Custom layout algorithms
- [ ] Undo/Redo functionality

## License

Same as parent project

