import { describe, it, expect, beforeEach } from 'vitest'
import { NodePositionCalculator, type ServiceNodeInfo, ContextualGroupPositioner } from '../composables/useNodePositioning'
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

  describe('ContextualGroupPositioner', () => {
    const mainGroupBounds = { x: 1000, y: 400, width: 400, height: 300 }
    let positioner: ContextualGroupPositioner

    beforeEach(() => {
      positioner = new ContextualGroupPositioner(mainGroupBounds)
    })

    it('should position a group on the left side', () => {
      const pos = positioner.calculatePosition('group1', 'left', [])
      expect(pos.x).toBeLessThan(mainGroupBounds.x)
      expect(pos.y).toBe(mainGroupBounds.y)
    })

    it('should position a group on the right side', () => {
      const pos = positioner.calculatePosition('group1', 'right', [])
      expect(pos.x).toBeGreaterThan(mainGroupBounds.x + mainGroupBounds.width)
      expect(pos.y).toBe(mainGroupBounds.y)
    })

    it('should avoid overlaps when multiple groups are on the same side', () => {
      const existingGroups = [
        { id: 'group1', position: positioner.calculatePosition('group1', 'left', []) }
      ]
      
      const pos2 = positioner.calculatePosition('group2', 'left', existingGroups)
      
      expect(pos2.y).not.toBe(existingGroups[0]!.position.y)
      
      // Verify no vertical overlap
      const h = 300 // groupHeight from class
      const overlap = !(pos2.y + h < existingGroups[0]!.position.y || pos2.y > existingGroups[0]!.position.y + h)
      expect(overlap).toBe(false)
    })

    it('should stack multiple groups correctly on the same side', () => {
      const existingGroups: { id: string; position: { x: number; y: number } }[] = []
      
      const pos1 = positioner.calculatePosition('group1', 'left', existingGroups)
      existingGroups.push({ id: 'group1', position: pos1 })
      
      const pos2 = positioner.calculatePosition('group2', 'left', existingGroups)
      existingGroups.push({ id: 'group2', position: pos2 })
      
      const pos3 = positioner.calculatePosition('group3', 'left', existingGroups)
      existingGroups.push({ id: 'group3', position: pos3 })
      
      // pos1.y should be 400 (baseY)
      // pos2.y should be 400 + 300 + 40 = 740
      // pos3.y should be 740 + 300 + 40 = 1080
      
      expect(pos1.y).toBe(400)
      expect(pos2.y).toBe(740)
      expect(pos3.y).toBe(1080)
      
      // Check if it handles 'right' side correctly too
      const rightGroups: { id: string; position: { x: number; y: number } }[] = []
      const posR1 = positioner.calculatePosition('groupR1', 'right', rightGroups)
      rightGroups.push({ id: 'groupR1', position: posR1 })
      const posR2 = positioner.calculatePosition('groupR2', 'right', rightGroups)
      
      expect(posR1.y).toBe(400)
      expect(posR2.y).toBe(740)
    })

    it('should position groups correctly on top and bottom', () => {
      const posTop = positioner.calculatePosition('frontend', 'top', [])
      expect(posTop.y).toBeLessThan(mainGroupBounds.y)
      expect(posTop.x).toBe(mainGroupBounds.x + (mainGroupBounds.width - 400) / 2)

      const posBottom = positioner.calculatePosition('data', 'bottom', [])
      expect(posBottom.y).toBeGreaterThan(mainGroupBounds.y + mainGroupBounds.height)
      expect(posBottom.x).toBe(mainGroupBounds.x + (mainGroupBounds.width - 400) / 2)
    })

    it('should stack multiple groups horizontally when on top/bottom', () => {
      const existingGroups: { id: string; position: { x: number; y: number } }[] = []
      
      const pos1 = positioner.calculatePosition('top1', 'top', existingGroups)
      existingGroups.push({ id: 'top1', position: pos1 })
      
      const pos2 = positioner.calculatePosition('top2', 'top', existingGroups)
      
      expect(pos2.x).toBe(pos1.x + 400 + 40)
      expect(pos2.y).toBe(pos1.y)
    })
  })
})
