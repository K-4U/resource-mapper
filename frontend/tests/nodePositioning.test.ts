import { describe, it, expect, beforeEach } from 'vitest'
import { NodePositionCalculator, type ServiceNodeInfo } from '../composables/useNodePositioning'
import { detectCollision, type NodeBounds } from '../utils/collisionDetection'
import type { ServiceDefinition } from '../types'

describe('NodePositionCalculator', () => {
  let calculator: NodePositionCalculator

  beforeEach(() => {
    calculator = new NodePositionCalculator({
      nodeWidth: 180,
      nodeHeight: 100,
      horizontalSpacing: 40,
      verticalSpacing: 30,
      groupPadding: 20,
      nodeMargin: 20,
      cols: 3
    })
  })

  function createMockService(
    groupName: string,
    identifier: string,
    outgoingConnections: string[] = [],
    incomingConnections: string[] = []
  ): ServiceDefinition {
    return {
      groupName,
      identifier,
      friendlyName: identifier,
      serviceType: 'EC2' as any,
      outgoingConnections: outgoingConnections.map(target => ({
        targetIdentifier: target,
        connectionType: 'API' as any,
        description: ''
      })),
      incomingConnections: incomingConnections.map(target => ({
        targetIdentifier: target,
        connectionType: 'API' as any,
        description: ''
      }))
    }
  }

  function verifyNoOverlaps(
    positions: { x: number; y: number }[],
    config: { nodeWidth: number; nodeHeight: number; nodeMargin: number }
  ): void {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const node1: NodeBounds = {
          x: positions[i]!.x,
          y: positions[i]!.y,
          width: config.nodeWidth,
          height: config.nodeHeight
        }
        const node2: NodeBounds = {
          x: positions[j]!.x,
          y: positions[j]!.y,
          width: config.nodeWidth,
          height: config.nodeHeight
        }
        
        const hasCollision = detectCollision(node1, node2, { margin: config.nodeMargin })
        if (hasCollision) {
          console.error(`Collision detected between position ${i} and ${j}`)
          console.error(`Node 1: x=${node1.x}, y=${node1.y}`)
          console.error(`Node 2: x=${node2.x}, y=${node2.y}`)
        }
        expect(hasCollision).toBe(false)
      }
    }
  }

  describe('Single Node Placement', () => {
    it('should place a single node without errors', () => {
      const service = createMockService('test-group', 'service1')
      calculator.registerServices([service])
      
      const position = calculator.calculatePosition('test-group/service1')
      
      expect(position).toBeDefined()
      expect(position.x).toBeGreaterThanOrEqual(0)
      expect(position.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Multiple Nodes No Overlaps', () => {
    it('should place multiple independent nodes without overlaps', () => {
      const services = [
        createMockService('test-group', 'service1'),
        createMockService('test-group', 'service2'),
        createMockService('test-group', 'service3'),
        createMockService('test-group', 'service4'),
        createMockService('test-group', 'service5')
      ]
      
      calculator.registerServices(services)
      
      const positions = services.map(s => 
        calculator.calculatePosition(`${s.groupName}/${s.identifier}`)
      )
      
      const config = calculator.getConfig()
      verifyNoOverlaps(positions, config)
    })

    it('should place nodes in a grid without overlaps', () => {
      const services = Array.from({ length: 9 }, (_, i) =>
        createMockService('test-group', `service${i + 1}`)
      )
      
      calculator.registerServices(services)
      
      const positions = services.map(s => 
        calculator.calculatePosition(`${s.groupName}/${s.identifier}`)
      )
      
      const config = calculator.getConfig()
      
      // Verify all positions are unique
      const uniquePositions = new Set(
        positions.map(p => `${p.x},${p.y}`)
      )
      expect(uniquePositions.size).toBe(positions.length)
      
      verifyNoOverlaps(positions, config)
    })
  })

  describe('Connected Nodes No Overlaps', () => {
    it('should place connected nodes without overlaps', () => {
      // Create a chain: service1 -> service2 -> service3
      const services = [
        createMockService('test-group', 'service1', ['test-group/service2'], []),
        createMockService('test-group', 'service2', ['test-group/service3'], ['test-group/service1']),
        createMockService('test-group', 'service3', [], ['test-group/service2'])
      ]
      
      calculator.registerServices(services)
      
      const positions = services.map(s => 
        calculator.calculatePosition(`${s.groupName}/${s.identifier}`)
      )
      
      const config = calculator.getConfig()
      verifyNoOverlaps(positions, config)
    })

    it('should handle complex connection graph without overlaps', () => {
      // Create a more complex graph
      const services = [
        createMockService('test-group', 'api-gateway', ['test-group/service1', 'test-group/service2'], []),
        createMockService('test-group', 'service1', ['test-group/database'], ['test-group/api-gateway']),
        createMockService('test-group', 'service2', ['test-group/database'], ['test-group/api-gateway']),
        createMockService('test-group', 'database', [], ['test-group/service1', 'test-group/service2']),
        createMockService('test-group', 'cache', [], [])
      ]
      
      calculator.registerServices(services)
      
      const positions = services.map(s => 
        calculator.calculatePosition(`${s.groupName}/${s.identifier}`)
      )
      
      const config = calculator.getConfig()
      verifyNoOverlaps(positions, config)
    })
  })

  describe('Configuration Respect', () => {
    it('should respect custom nodeMargin configuration', () => {
      const customMargin = 20
      const customCalculator = new NodePositionCalculator({
        nodeWidth: 180,
        nodeHeight: 100,
        nodeMargin: customMargin
      })
      
      const services = [
        createMockService('test-group', 'service1'),
        createMockService('test-group', 'service2')
      ]
      
      customCalculator.registerServices(services)
      
      const pos1 = customCalculator.calculatePosition('test-group/service1')
      const pos2 = customCalculator.calculatePosition('test-group/service2')
      
      const node1: NodeBounds = { x: pos1.x, y: pos1.y, width: 180, height: 100 }
      const node2: NodeBounds = { x: pos2.x, y: pos2.y, width: 180, height: 100 }
      
      // Should not collide with custom margin
      expect(detectCollision(node1, node2, { margin: customMargin })).toBe(false)
    })

    it('should respect horizontal layout without overlaps', () => {
      const horizontalCalculator = new NodePositionCalculator({
        connectionDirection: 'horizontal',
        nodeWidth: 180,
        nodeHeight: 100,
        nodeMargin: 20
      })
      
      const services = Array.from({ length: 6 }, (_, i) =>
        createMockService('test-group', `service${i + 1}`)
      )
      
      horizontalCalculator.registerServices(services)
      
      const positions = services.map(s => 
        horizontalCalculator.calculatePosition(`${s.groupName}/${s.identifier}`)
      )
      
      verifyNoOverlaps(positions, { nodeWidth: 180, nodeHeight: 100, nodeMargin: 20 })
    })
  })

  describe('Stress Test', () => {
    it('should place 20 nodes without any overlaps', () => {
      const services = Array.from({ length: 20 }, (_, i) =>
        createMockService('test-group', `service${i + 1}`)
      )
      
      calculator.registerServices(services)
      
      const positions = services.map(s => 
        calculator.calculatePosition(`${s.groupName}/${s.identifier}`)
      )
      
      const config = calculator.getConfig()
      verifyNoOverlaps(positions, config)
    })
  })
})
