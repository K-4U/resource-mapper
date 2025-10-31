import { describe, it, expect } from 'vitest'
import { 
  detectCollision, 
  findFirstCollision, 
  findNearestValidPosition,
  calculateMinimumSeparation,
  type NodeBounds,
  type CollisionConfig
} from '../utils/collisionDetection'

describe('Collision Detection', () => {
  describe('detectCollision', () => {
    it('should detect collision when nodes overlap', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 50, y: 40, width: 100, height: 80 }
      
      expect(detectCollision(node1, node2, { margin: 0 })).toBe(true)
    })

    it('should not detect collision when nodes are separated', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 200, y: 200, width: 100, height: 80 }
      
      expect(detectCollision(node1, node2, { margin: 0 })).toBe(false)
    })

    it('should detect collision when nodes are exactly adjacent with margin', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 100, y: 0, width: 100, height: 80 }
      const config: CollisionConfig = { margin: 10 }
      
      // With margin, adjacent nodes should collide
      expect(detectCollision(node1, node2, config)).toBe(true)
    })

    it('should not detect collision when nodes are separated by margin', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 110, y: 0, width: 100, height: 80 }
      const config: CollisionConfig = { margin: 10 }
      
      // Nodes are separated by exactly the margin
      expect(detectCollision(node1, node2, config)).toBe(false)
    })

    it('should handle nodes touching at corners', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 100, y: 80, width: 100, height: 80 }
      
      // Touching at corners is not a collision
      expect(detectCollision(node1, node2, { margin: 0 })).toBe(false)
    })

    it('should handle completely overlapping nodes', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      
      expect(detectCollision(node1, node2, { margin: 0 })).toBe(true)
    })

    it('should handle node1 inside node2', () => {
      const node1: NodeBounds = { x: 50, y: 40, width: 20, height: 20 }
      const node2: NodeBounds = { x: 0, y: 0, width: 200, height: 200 }
      
      expect(detectCollision(node1, node2, { margin: 0 })).toBe(true)
    })
  })

  describe('findFirstCollision', () => {
    it('should find first colliding node', () => {
      const node: NodeBounds = { x: 50, y: 50, width: 100, height: 80 }
      const otherNodes: NodeBounds[] = [
        { x: 200, y: 200, width: 100, height: 80 }, // No collision
        { x: 100, y: 100, width: 100, height: 80 }, // Collision
        { x: 90, y: 90, width: 100, height: 80 }    // Also collision
      ]
      
      const collision = findFirstCollision(node, otherNodes, { margin: 0 })
      expect(collision).not.toBeNull()
      expect(collision).toEqual(otherNodes[1])
    })

    it('should return null when no collisions', () => {
      const node: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const otherNodes: NodeBounds[] = [
        { x: 200, y: 200, width: 100, height: 80 },
        { x: 300, y: 300, width: 100, height: 80 }
      ]
      
      const collision = findFirstCollision(node, otherNodes, { margin: 0 })
      expect(collision).toBeNull()
    })

    it('should return null for empty node list', () => {
      const node: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const collision = findFirstCollision(node, [], { margin: 0 })
      expect(collision).toBeNull()
    })
  })

  describe('findNearestValidPosition', () => {
    it('should return desired position when no collisions', () => {
      const desiredPosition = { x: 100, y: 100 }
      const nodeSize = { width: 100, height: 80 }
      const existingNodes: NodeBounds[] = [
        { x: 300, y: 300, width: 100, height: 80 }
      ]
      
      const validPosition = findNearestValidPosition(
        desiredPosition,
        nodeSize,
        existingNodes,
        { margin: 10 }
      )
      
      expect(validPosition).toEqual(desiredPosition)
    })

    it('should find alternative position when collision occurs', () => {
      const desiredPosition = { x: 0, y: 0 }
      const nodeSize = { width: 100, height: 80 }
      const existingNodes: NodeBounds[] = [
        { x: 0, y: 0, width: 100, height: 80 } // Blocking desired position
      ]
      
      const validPosition = findNearestValidPosition(
        desiredPosition,
        nodeSize,
        existingNodes,
        { margin: 10 }
      )
      
      // Should find a different position
      expect(validPosition).not.toEqual(desiredPosition)
      
      // Verify no collision at new position
      const testNode: NodeBounds = { ...validPosition, ...nodeSize }
      const collision = findFirstCollision(testNode, existingNodes, { margin: 10 })
      expect(collision).toBeNull()
    })

    it('should respect preferred horizontal direction', () => {
      const desiredPosition = { x: 100, y: 100 }
      const nodeSize = { width: 100, height: 80 }
      const existingNodes: NodeBounds[] = [
        { x: 100, y: 100, width: 100, height: 80 }
      ]
      
      const validPosition = findNearestValidPosition(
        desiredPosition,
        nodeSize,
        existingNodes,
        { margin: 10 },
        { preferredDirection: 'horizontal' }
      )
      
      // With horizontal preference, should move right first
      expect(validPosition.x).toBeGreaterThan(desiredPosition.x)
    })

    it('should respect preferred vertical direction', () => {
      const desiredPosition = { x: 100, y: 100 }
      const nodeSize = { width: 100, height: 80 }
      const existingNodes: NodeBounds[] = [
        { x: 100, y: 100, width: 100, height: 80 }
      ]
      
      const validPosition = findNearestValidPosition(
        desiredPosition,
        nodeSize,
        existingNodes,
        { margin: 10 },
        { preferredDirection: 'vertical' }
      )
      
      // With vertical preference, should move down first
      expect(validPosition.y).toBeGreaterThan(desiredPosition.y)
    })

    it('should handle multiple blocking nodes', () => {
      const desiredPosition = { x: 100, y: 100 }
      const nodeSize = { width: 100, height: 80 }
      const existingNodes: NodeBounds[] = [
        { x: 100, y: 100, width: 100, height: 80 },  // Center
        { x: 210, y: 100, width: 100, height: 80 },  // Right
        { x: 100, y: 190, width: 100, height: 80 }   // Down
      ]
      
      const validPosition = findNearestValidPosition(
        desiredPosition,
        nodeSize,
        existingNodes,
        { margin: 10 },
        { maxAttempts: 50 }
      )
      
      // Should find a valid position
      const testNode: NodeBounds = { ...validPosition, ...nodeSize }
      const collision = findFirstCollision(testNode, existingNodes, { margin: 10 })
      expect(collision).toBeNull()
    })

    it('should not return negative positions', () => {
      const desiredPosition = { x: 0, y: 0 }
      const nodeSize = { width: 100, height: 80 }
      const existingNodes: NodeBounds[] = [
        { x: 0, y: 0, width: 100, height: 80 }
      ]
      
      const validPosition = findNearestValidPosition(
        desiredPosition,
        nodeSize,
        existingNodes,
        { margin: 10 }
      )
      
      expect(validPosition.x).toBeGreaterThanOrEqual(0)
      expect(validPosition.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateMinimumSeparation', () => {
    it('should return null when nodes do not collide', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 200, y: 200, width: 100, height: 80 }
      
      const separation = calculateMinimumSeparation(node1, node2, { margin: 10 })
      expect(separation).toBeNull()
    })

    it('should calculate horizontal separation when x-overlap is smaller', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 50, y: 0, width: 100, height: 80 }
      
      const separation = calculateMinimumSeparation(node1, node2, { margin: 10 })
      expect(separation).not.toBeNull()
      expect(separation!.dx).not.toBe(0)
      expect(separation!.dy).toBe(0)
    })

    it('should calculate vertical separation when y-overlap is smaller', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 0, y: 40, width: 100, height: 80 }
      
      const separation = calculateMinimumSeparation(node1, node2, { margin: 10 })
      expect(separation).not.toBeNull()
      expect(separation!.dx).toBe(0)
      expect(separation!.dy).not.toBe(0)
    })

    it('should move left when node1 is left of node2', () => {
      const node1: NodeBounds = { x: 0, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 50, y: 0, width: 100, height: 80 }
      
      const separation = calculateMinimumSeparation(node1, node2, { margin: 10 })
      expect(separation).not.toBeNull()
      expect(separation!.dx).toBeLessThan(0) // Move left
    })

    it('should move right when node1 is right of node2', () => {
      const node1: NodeBounds = { x: 100, y: 0, width: 100, height: 80 }
      const node2: NodeBounds = { x: 50, y: 0, width: 100, height: 80 }
      
      const separation = calculateMinimumSeparation(node1, node2, { margin: 10 })
      expect(separation).not.toBeNull()
      expect(separation!.dx).toBeGreaterThan(0) // Move right
    })
  })

  describe('Integration: Node Placement Without Overlaps', () => {
    it('should place multiple nodes without any overlaps', () => {
      const nodeSize = { width: 140, height: 80 }
      const margin = 10
      const placedNodes: NodeBounds[] = []
      
      // Simulate placing 10 nodes
      for (let i = 0; i < 10; i++) {
        const desiredPosition = {
          x: (i % 3) * 150,
          y: Math.floor(i / 3) * 90
        }
        
        const validPosition = findNearestValidPosition(
          desiredPosition,
          nodeSize,
          placedNodes,
          { margin }
        )
        
        const newNode: NodeBounds = {
          ...validPosition,
          ...nodeSize
        }
        
        // Verify no collision with any placed node
        for (const placedNode of placedNodes) {
          expect(detectCollision(newNode, placedNode, { margin })).toBe(false)
        }
        
        placedNodes.push(newNode)
      }
      
      // All 10 nodes should be placed
      expect(placedNodes).toHaveLength(10)
    })

    it('should maintain minimum margin between all nodes', () => {
      const nodeSize = { width: 100, height: 80 }
      const margin = 20
      const placedNodes: NodeBounds[] = [
        { x: 0, y: 0, width: 100, height: 80 },
        { x: 120, y: 0, width: 100, height: 80 },
        { x: 0, y: 100, width: 100, height: 80 }
      ]
      
      // Try to place a node that would violate margin
      const desiredPosition = { x: 110, y: 90 }
      const validPosition = findNearestValidPosition(
        desiredPosition,
        nodeSize,
        placedNodes,
        { margin }
      )
      
      const newNode: NodeBounds = { ...validPosition, ...nodeSize }
      
      // Verify minimum margin is maintained
      for (const placedNode of placedNodes) {
        const xDistance = Math.min(
          Math.abs(newNode.x - (placedNode.x + placedNode.width)),
          Math.abs((newNode.x + newNode.width) - placedNode.x)
        )
        const yDistance = Math.min(
          Math.abs(newNode.y - (placedNode.y + placedNode.height)),
          Math.abs((newNode.y + newNode.height) - placedNode.y)
        )
        
        // At least one dimension should have sufficient distance
        expect(xDistance >= margin || yDistance >= margin).toBe(true)
      }
    })
  })
})
