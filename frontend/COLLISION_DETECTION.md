# Collision Detection System

The Resource Mapper frontend includes a comprehensive collision detection system that ensures service nodes never occupy the same space, both during initial placement and while dragging.

## Features

- **Initial Placement**: Nodes are automatically positioned without overlaps when the diagram is first rendered
- **Configurable Margin**: Easily adjust the minimum spacing between nodes (default: 20px)
- **Smart Positioning**: Uses spiral search algorithm to find nearest valid position when collisions are detected
- **Draggable After Placement**: Nodes can be freely moved after initial placement (no collision prevention during drag)

## Configuration

### Node Margin

The margin between nodes is configurable via the `nodeMargin` parameter in `PositionConfig`. The default is 20 pixels.

```typescript
const calculator = new NodePositionCalculator({
  nodeMargin: 25, // Increase margin to 25 pixels
  nodeWidth: 180,  // Actual rendered width
  nodeHeight: 100, // Actual rendered height
  // ... other config
})
```

### Important: Node Dimensions

The collision detection uses **actual rendered dimensions** (180x100) which account for:
- Minimum card width/height
- Quasar's padding (`q-pa-sm` on card sections)
- Icon and text content

If you change the node styling, update these dimensions in `useFlowNodes.ts`:

### Group Configuration

In `useFlowNodes.ts`, you can configure the margin when creating group nodes:

```typescript
const defaultConfig: Partial<PositionConfig> = {
  cols: isExternal ? 2 : 3,
  nodeWidth: 180,   // Actual rendered width
  nodeHeight: 100,  // Actual rendered height
  horizontalSpacing: 40,
  verticalSpacing: 30,
  nodeMargin: 20,   // Minimum space between nodes
  groupPadding: 20,
  connectionDirection: 'vertical',
  sourceSide: 'bottom',
  targetSide: 'top'
}
```

## How It Works

### 1. Collision Detection Utility (`utils/collisionDetection.ts`)

The collision detection uses **Axis-Aligned Bounding Box (AABB)** collision detection:

```typescript
// Check if two nodes collide
const collision = detectCollision(node1, node2, { margin: 10 })
```

Key functions:
- `detectCollision()` - Check if two nodes overlap
- `findFirstCollision()` - Find the first colliding node in a list
- `findNearestValidPosition()` - Find the nearest position that doesn't collide
- `calculateMinimumSeparation()` - Calculate how far to move to avoid collision

### 2. Initial Placement (`composables/useNodePositioning.ts`)

The `NodePositionCalculator` ensures nodes are placed without overlaps:

1. Calculates initial position based on layer/column
2. Checks for collisions with existing nodes
3. If collision detected, uses spiral search to find nearest valid position
4. Respects the configured `nodeMargin`

**Note**: Collision detection only applies to initial placement. After nodes are placed, they can be freely dragged and repositioned by the user.

## Node Types

Collision detection applies to service node placement:

- **Service Nodes**: Full collision detection during initial placement
- **Group Nodes**: Can overlap with each other (they're containers)
- **After Placement**: All nodes can be freely dragged and repositioned

## Testing

The system includes comprehensive unit tests:

### Collision Detection Tests (`tests/collisionDetection.test.ts`)

- 23 test cases covering:
  - Basic collision detection
  - Margin handling
  - Finding valid positions
  - Edge cases (overlapping, touching, nested nodes)

### Node Positioning Tests (`tests/nodePositioning.test.ts`)

- 8 test cases covering:
  - Single and multiple node placement
  - Connected nodes (dependency graphs)
  - Custom configuration
  - Stress test with 20 nodes

Run the tests:

```bash
# Run collision detection tests
npx vitest run tests/collisionDetection.test.ts

# Run node positioning tests
npx vitest run tests/nodePositioning.test.ts

# Run all tests
npx vitest run
```

## Examples

### Example 1: Increase Margin Between Nodes

```typescript
// In GroupNode constructor
this.positionCalculator = new NodePositionCalculator({
  nodeMargin: 30, // Increase from default 20 to 30
  // ... other config
})
```

### Example 2: Custom Collision Detection

```typescript
import { detectCollision, type NodeBounds } from '~/utils/collisionDetection'

const node1: NodeBounds = { x: 0, y: 0, width: 180, height: 100 }
const node2: NodeBounds = { x: 150, y: 80, width: 180, height: 100 }

if (detectCollision(node1, node2, { margin: 20 })) {
  console.log('Nodes overlap!')
}
```

### Example 3: Find Valid Position

```typescript
import { findNearestValidPosition } from '~/utils/collisionDetection'

const validPosition = findNearestValidPosition(
  { x: 100, y: 100 },           // Desired position
  { width: 180, height: 100 },  // Node size
  existingNodes,                 // Array of placed nodes
  { margin: 20 },               // Collision config
  {
    preferredDirection: 'horizontal',  // Try moving right first
    maxAttempts: 50                   // Max search iterations
  }
)
```

## Architecture

```
┌─────────────────────────────────────────┐
│  FlowCanvas.vue                         │
│  - Handles drag events                  │
│  - Prevents overlaps during dragging    │
└────────────┬────────────────────────────┘
             │
             ├─> Uses collision detection
             │
┌────────────▼────────────────────────────┐
│  useNodePositioning.ts                  │
│  - NodePositionCalculator               │
│  - Calculates initial positions         │
│  - Uses ensureNoOverlap()               │
└────────────┬────────────────────────────┘
             │
             ├─> Uses collision utilities
             │
┌────────────▼────────────────────────────┐
│  collisionDetection.ts                  │
│  - detectCollision()                    │
│  - findNearestValidPosition()           │
│  - calculateMinimumSeparation()         │
└─────────────────────────────────────────┘
```

## Performance

- **Collision checks**: O(n) for each node during initial placement
- **Position finding**: Spiral search with configurable max attempts (default: 50)
- **No drag overhead**: Collision detection only runs during initial placement
- **Optimizations**: 
  - Early exit when no collision detected
  - Filtered node lists (excludes groups)
  - Configurable search parameters

## Limitations

1. **Group Nodes**: Groups can overlap with each other (by design, as they are containers)
2. **Max Search Attempts**: If no valid position found within max attempts, fallback position is used
3. **Post-Placement**: No collision prevention after initial placement - nodes can be freely repositioned

## Future Enhancements

Possible improvements:
- Spatial indexing (quadtree) for O(log n) collision detection
- Optional drag collision prevention (can be enabled/disabled)
- Visual feedback for overlapping nodes
- Automatic layout optimization to minimize total displacement
