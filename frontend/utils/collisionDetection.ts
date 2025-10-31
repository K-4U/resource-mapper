/**
 * Collision detection utilities for node positioning
 */

export interface NodeBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface CollisionConfig {
  margin: number // Minimum space between nodes
}

/**
 * Check if two nodes collide considering their dimensions and margin
 */
export function detectCollision(
  node1: NodeBounds,
  node2: NodeBounds,
  config: CollisionConfig = { margin: 10 }
): boolean {
  const { margin } = config
  
  // Calculate effective bounds including margin
  const node1Left = node1.x - margin / 2
  const node1Right = node1.x + node1.width + margin / 2
  const node1Top = node1.y - margin / 2
  const node1Bottom = node1.y + node1.height + margin / 2
  
  const node2Left = node2.x - margin / 2
  const node2Right = node2.x + node2.width + margin / 2
  const node2Top = node2.y - margin / 2
  const node2Bottom = node2.y + node2.height + margin / 2
  
  // Check for overlap using AABB (Axis-Aligned Bounding Box) collision detection
  const xOverlap = node1Left < node2Right && node1Right > node2Left
  const yOverlap = node1Top < node2Bottom && node1Bottom > node2Top
  
  return xOverlap && yOverlap
}

/**
 * Check if a node collides with any node in a list
 * Returns the first colliding node or null
 */
export function findFirstCollision(
  node: NodeBounds,
  otherNodes: NodeBounds[],
  config: CollisionConfig = { margin: 10 }
): NodeBounds | null {
  for (const otherNode of otherNodes) {
    if (detectCollision(node, otherNode, config)) {
      return otherNode
    }
  }
  return null
}

/**
 * Find a valid position near the desired position that doesn't collide
 * Uses a spiral search pattern to find the nearest available spot
 */
export function findNearestValidPosition(
  desiredPosition: { x: number; y: number },
  nodeSize: { width: number; height: number },
  existingNodes: NodeBounds[],
  config: CollisionConfig = { margin: 10 },
  searchOptions: {
    maxAttempts?: number
    stepX?: number
    stepY?: number
    preferredDirection?: 'horizontal' | 'vertical'
  } = {}
): { x: number; y: number } {
  const {
    maxAttempts = 100,
    stepX = nodeSize.width + config.margin,
    stepY = nodeSize.height + config.margin,
    preferredDirection = 'horizontal'
  } = searchOptions
  
  // Start with the desired position
  let testPosition = { ...desiredPosition }
  const testNode: NodeBounds = {
    ...testPosition,
    ...nodeSize
  }
  
  // If no collision at desired position, return it
  if (!findFirstCollision(testNode, existingNodes, config)) {
    return testPosition
  }
  
  // Spiral search pattern
  let attempt = 0
  let distance = 1
  
  while (attempt < maxAttempts) {
    // Try positions in a spiral: right, down, left, up, then increase distance
    const directions = preferredDirection === 'horizontal'
      ? [
          { dx: distance, dy: 0 },      // right
          { dx: 0, dy: distance },       // down
          { dx: -distance, dy: 0 },      // left
          { dx: 0, dy: -distance },      // up
          { dx: distance, dy: distance }, // diagonal right-down
          { dx: -distance, dy: distance }, // diagonal left-down
        ]
      : [
          { dx: 0, dy: distance },       // down
          { dx: distance, dy: 0 },      // right
          { dx: 0, dy: -distance },      // up
          { dx: -distance, dy: 0 },      // left
          { dx: distance, dy: distance }, // diagonal right-down
          { dx: -distance, dy: distance }, // diagonal left-down
        ]
    
    for (const { dx, dy } of directions) {
      testPosition = {
        x: desiredPosition.x + (dx * stepX),
        y: desiredPosition.y + (dy * stepY)
      }
      
      // Ensure position is not negative
      if (testPosition.x < 0 || testPosition.y < 0) {
        continue
      }
      
      testNode.x = testPosition.x
      testNode.y = testPosition.y
      
      if (!findFirstCollision(testNode, existingNodes, config)) {
        return testPosition
      }
      
      attempt++
      if (attempt >= maxAttempts) {
        break
      }
    }
    
    distance++
  }
  
  // Fallback: return a position far to the right/down
  return {
    x: desiredPosition.x + distance * stepX,
    y: desiredPosition.y + distance * stepY
  }
}

/**
 * Calculate the minimum distance to move a node to avoid collision
 */
export function calculateMinimumSeparation(
  node1: NodeBounds,
  node2: NodeBounds,
  config: CollisionConfig = { margin: 10 }
): { dx: number; dy: number } | null {
  if (!detectCollision(node1, node2, config)) {
    return null // No collision
  }
  
  const { margin } = config
  
  // Calculate overlaps
  const overlapX = Math.min(
    node1.x + node1.width + margin / 2 - (node2.x - margin / 2),
    node2.x + node2.width + margin / 2 - (node1.x - margin / 2)
  )
  
  const overlapY = Math.min(
    node1.y + node1.height + margin / 2 - (node2.y - margin / 2),
    node2.y + node2.height + margin / 2 - (node1.y - margin / 2)
  )
  
  // Move in the direction of least resistance
  if (overlapX < overlapY) {
    // Move horizontally
    const dx = node1.x < node2.x ? -overlapX : overlapX
    return { dx, dy: 0 }
  } else {
    // Move vertically
    const dy = node1.y < node2.y ? -overlapY : overlapY
    return { dx: 0, dy }
  }
}
