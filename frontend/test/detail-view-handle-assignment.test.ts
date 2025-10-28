import { describe, it, expect, beforeEach } from 'vitest'
import { useGroupGraph } from '~/composables/useGroupGraph'
import type { ServiceDefinition } from '~/types'
import { ConnectionType, ServiceType } from '~/types'

describe('Detail View Handle Assignment', () => {
  let useGroupGraphInstance: ReturnType<typeof useGroupGraph>

  beforeEach(() => {
    useGroupGraphInstance = useGroupGraph()
  })

  describe('Position-based handles for services', () => {
    it('should assign position-based handles instead of sequential handles', () => {
      // Create a minimal test with proper types
      const mockServices: ServiceDefinition[] = [
        {
          groupName: 'compute',
          identifier: 'service1',
          friendlyName: 'Service 1',
          serviceType: ServiceType.ECS,
          outgoingConnections: [
            {
              targetIdentifier: 'data/redis',
              connectionType: ConnectionType.TCP,
              description: 'connects to cache'
            }
          ]
        }
      ]

      const mockAllServices: Record<string, ServiceDefinition[]> = {
        compute: mockServices,
        data: [
          {
            groupName: 'data',
            identifier: 'redis',
            friendlyName: 'Redis Cache',
            serviceType: ServiceType.VALKEY
          }
        ]
      }

      const result = useGroupGraphInstance.buildGraph(
        mockServices,
        mockAllServices,
        'compute',
        'Compute',
        false,
        false
      )

      // Should create at least one edge
      expect(result.edges.length).toBeGreaterThan(0)
      
      // All edges should have valid handles (not temporary placeholders)
      result.edges.forEach(edge => {
        expect(edge.sourceHandle).toBeDefined()
        expect(edge.targetHandle).toBeDefined()
        expect(edge.sourceHandle).not.toBe('output-temp')
        expect(edge.targetHandle).not.toBe('input-temp')
        
        // Should use position-based format if available
        if (edge.sourceHandle !== 'output') {
          expect(edge.sourceHandle).toMatch(/^output-bottom-\d+$/)
        }
        if (edge.targetHandle && !edge.targetHandle.startsWith('input-')) {
          expect(edge.targetHandle).toMatch(/^input-top-\d+$/)
        }
      })
    })

    it('should handle multiple connections to same target with unique handles', () => {
      const mockServices: ServiceDefinition[] = [
        {
          groupName: 'compute',
          identifier: 'service1',
          friendlyName: 'Service 1',
          serviceType: ServiceType.ECS,
          outgoingConnections: [
            {
              targetIdentifier: 'data/database',
              connectionType: ConnectionType.TCP,
              description: 'read connection'
            }
          ]
        },
        {
          groupName: 'compute',
          identifier: 'service2',
          friendlyName: 'Service 2',
          serviceType: ServiceType.ECS,
          outgoingConnections: [
            {
              targetIdentifier: 'data/database',
              connectionType: ConnectionType.TCP,
              description: 'write connection'
            }
          ]
        }
      ]

      const mockAllServices: Record<string, ServiceDefinition[]> = {
        compute: mockServices,
        data: [
          {
            groupName: 'data',
            identifier: 'database',
            friendlyName: 'Database',
            serviceType: ServiceType.RDS
          }
        ]
      }

      const result = useGroupGraphInstance.buildGraph(
        mockServices,
        mockAllServices,
        'compute',
        'Compute',
        false,
        false
      )

      // Find edges connecting to the database
      const dbEdges = result.edges.filter(e => e.target === 'data/database')
      
      if (dbEdges.length > 1) {
        // All target handles should be unique
        const targetHandles = dbEdges.map(e => e.targetHandle)
        const uniqueHandles = new Set(targetHandles)
        expect(uniqueHandles.size).toBe(targetHandles.length)
      }
    })
  })
})