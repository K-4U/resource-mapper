import { describe, it, expect, beforeEach } from 'vitest'
import { useGroupGraph } from '~/composables/useGroupGraph'
import type { GroupConnection } from '~/types'

describe('Group Connection Handle Assignment', () => {
  let useGroupGraphInstance: ReturnType<typeof useGroupGraph>

  beforeEach(() => {
    useGroupGraphInstance = useGroupGraph()
  })

  /**
   * Test the specific 4-group layout scenario:
   * 
   * API      Compute
   * (0,0)    (300,0)
   * 
   * Frontend Data
   * (0,200)  (300,200)
   * 
   * Expected connections and handle assignments:
   * - API -> Compute: API's topmost handle (output-right-0) -> Compute's topmost handle (input-left-0)
   * - API -> Data: API's bottommost handle (output-right-1) -> Data's bottommost handle (input-left-1)
   * - Compute -> Data: Compute's handle (output-right-0) -> Data's topmost handle (input-left-0)
   * - Frontend -> Compute: Frontend's handle (output-right-0) -> Compute's bottommost handle (input-left-1)
   */
  describe('Four-Group Layout Handle Assignment', () => {
    const mockGroupConnections: GroupConnection[] = [
      {
        groupName: 'api',
        connectedToGroups: new Set(['compute', 'data']),
        serviceCount: 3
      },
      {
        groupName: 'compute',
        connectedToGroups: new Set(['data']),
        serviceCount: 2
      },
      {
        groupName: 'frontend',
        connectedToGroups: new Set(['compute']),
        serviceCount: 4
      },
      {
        groupName: 'data',
        connectedToGroups: new Set(),
        serviceCount: 5
      }
    ]

    it('should assign handles correctly for the four-group layout', () => {
      const result = useGroupGraphInstance.buildGraphFromConnections(mockGroupConnections)

      // Verify we have 4 nodes
      expect(result.nodes).toHaveLength(4)
      
      // Verify we have 4 edges (api->compute, api->data, compute->data, frontend->compute)
      expect(result.edges).toHaveLength(4)

      // Find specific edges
      const apiToCompute = result.edges.find(e => e.source === 'api' && e.target === 'compute')
      const apiToData = result.edges.find(e => e.source === 'api' && e.target === 'data')
      const computeToData = result.edges.find(e => e.source === 'compute' && e.target === 'data')
      const frontendToCompute = result.edges.find(e => e.source === 'frontend' && e.target === 'compute')

      // Verify all edges exist
      expect(apiToCompute).toBeDefined()
      expect(apiToData).toBeDefined()
      expect(computeToData).toBeDefined()
      expect(frontendToCompute).toBeDefined()

      // The key test: each edge should have unique handles assigned
      // We don't test exact handle IDs since positioning may vary, but we test the logic
      
      // API has 2 outgoing connections, so should use handles 0 and 1
      const apiEdges = result.edges.filter(e => e.source === 'api').sort((a, b) => a.sourceHandle!.localeCompare(b.sourceHandle!))
      expect(apiEdges).toHaveLength(2)
      expect(apiEdges[0]?.sourceHandle).toBe('output-right-0')
      expect(apiEdges[1]?.sourceHandle).toBe('output-right-1')

      // Data has 2 incoming connections, so should use handles 0 and 1 
      const dataEdges = result.edges.filter(e => e.target === 'data').sort((a, b) => a.targetHandle!.localeCompare(b.targetHandle!))
      expect(dataEdges).toHaveLength(2)
      expect(dataEdges[0]?.targetHandle).toBe('input-left-0')
      expect(dataEdges[1]?.targetHandle).toBe('input-left-1')

      // Compute has 2 incoming connections, so should use handles 0 and 1
      const computeIncomingEdges = result.edges.filter(e => e.target === 'compute').sort((a, b) => a.targetHandle!.localeCompare(b.targetHandle!))
      expect(computeIncomingEdges).toHaveLength(2)
      expect(computeIncomingEdges[0]?.targetHandle).toBe('input-left-0')
      expect(computeIncomingEdges[1]?.targetHandle).toBe('input-left-1')

      // All edges should have proper handle assignments
      result.edges.forEach(edge => {
        expect(edge.sourceHandle).toMatch(/^output-right-\d+$/)
        expect(edge.targetHandle).toMatch(/^input-left-\d+$/)
      })
    })

    it('should create nodes with correct connection counts', () => {
      const result = useGroupGraphInstance.buildGraphFromConnections(mockGroupConnections)

      // Find specific nodes
      const apiNode = result.nodes.find(n => n.id === 'api')
      const computeNode = result.nodes.find(n => n.id === 'compute')
      const frontendNode = result.nodes.find(n => n.id === 'frontend')
      const dataNode = result.nodes.find(n => n.id === 'data')

      // Verify connection counts
      expect(apiNode?.data.totalOutgoingCount).toBe(2) // connects to compute, data
      expect(apiNode?.data.totalIncomingCount).toBe(0) // no incoming connections

      expect(computeNode?.data.totalOutgoingCount).toBe(1) // connects to data
      expect(computeNode?.data.totalIncomingCount).toBe(2) // from api, frontend

      expect(frontendNode?.data.totalOutgoingCount).toBe(1) // connects to compute
      expect(frontendNode?.data.totalIncomingCount).toBe(0) // no incoming connections

      expect(dataNode?.data.totalOutgoingCount).toBe(0) // no outgoing connections
      expect(dataNode?.data.totalIncomingCount).toBe(2) // from api, compute
    })

    it('should assign unique handles for multiple connections', () => {
      const result = useGroupGraphInstance.buildGraphFromConnections(mockGroupConnections)

      // Test that each group uses sequential handle indices
      const allEdges = result.edges

      // Group edges by source and verify sequential handle assignment
      const edgesBySource = new Map<string, typeof allEdges>()
      allEdges.forEach(edge => {
        if (!edgesBySource.has(edge.source)) {
          edgesBySource.set(edge.source, [])
        }
        edgesBySource.get(edge.source)!.push(edge)
      })

      edgesBySource.forEach((edges, source) => {
        const sortedEdges = edges.sort((a, b) => a.sourceHandle!.localeCompare(b.sourceHandle!))
        sortedEdges.forEach((edge, index) => {
          expect(edge.sourceHandle).toBe(`output-right-${index}`)
        })
      })

      // Group edges by target and verify sequential handle assignment
      const edgesByTarget = new Map<string, typeof allEdges>()
      allEdges.forEach(edge => {
        if (!edgesByTarget.has(edge.target)) {
          edgesByTarget.set(edge.target, [])
        }
        edgesByTarget.get(edge.target)!.push(edge)
      })

      edgesByTarget.forEach((edges, target) => {
        const sortedEdges = edges.sort((a, b) => a.targetHandle!.localeCompare(b.targetHandle!))
        sortedEdges.forEach((edge, index) => {
          expect(edge.targetHandle).toBe(`input-left-${index}`)
        })
      })
    })
  })

  describe('Edge Case Scenarios', () => {
    it('should handle single connection correctly', () => {
      const singleConnection: GroupConnection[] = [
        {
          groupName: 'source',
          connectedToGroups: new Set(['target']),
          serviceCount: 1
        },
        {
          groupName: 'target',
          connectedToGroups: new Set(),
          serviceCount: 1
        }
      ]

      const result = useGroupGraphInstance.buildGraphFromConnections(singleConnection)
      
      expect(result.edges).toHaveLength(1)
      const edge = result.edges[0]
      expect(edge?.sourceHandle).toBe('output-right-0')
      expect(edge?.targetHandle).toBe('input-left-0')
    })

    it('should handle multiple connections from single source', () => {
      const multipleConnections: GroupConnection[] = [
        {
          groupName: 'hub',
          connectedToGroups: new Set(['a', 'b', 'c']),
          serviceCount: 1
        },
        {
          groupName: 'a',
          connectedToGroups: new Set(),
          serviceCount: 1
        },
        {
          groupName: 'b', 
          connectedToGroups: new Set(),
          serviceCount: 1
        },
        {
          groupName: 'c',
          connectedToGroups: new Set(),
          serviceCount: 1
        }
      ]

      const result = useGroupGraphInstance.buildGraphFromConnections(multipleConnections)
      
      expect(result.edges).toHaveLength(3) // hub connects to a, b, c

      // Hub should use sequential handles for its outgoing connections
      const hubEdges = result.edges.filter(e => e.source === 'hub').sort((a, b) => a.sourceHandle!.localeCompare(b.sourceHandle!))
      expect(hubEdges).toHaveLength(3)
      expect(hubEdges[0]?.sourceHandle).toBe('output-right-0')
      expect(hubEdges[1]?.sourceHandle).toBe('output-right-1')  
      expect(hubEdges[2]?.sourceHandle).toBe('output-right-2')
    })

    it('should handle multiple connections to single target', () => {
      const convergingConnections: GroupConnection[] = [
        {
          groupName: 'a',
          connectedToGroups: new Set(['target']),
          serviceCount: 1
        },
        {
          groupName: 'b',
          connectedToGroups: new Set(['target']),
          serviceCount: 1
        },
        {
          groupName: 'c',
          connectedToGroups: new Set(['target']),
          serviceCount: 1
        },
        {
          groupName: 'target',
          connectedToGroups: new Set(),
          serviceCount: 1
        }
      ]

      const result = useGroupGraphInstance.buildGraphFromConnections(convergingConnections)
      
      expect(result.edges).toHaveLength(3) // a,b,c all connect to target

      // Target should use sequential handles for its incoming connections
      const targetEdges = result.edges.filter(e => e.target === 'target').sort((a, b) => a.targetHandle!.localeCompare(b.targetHandle!))
      expect(targetEdges).toHaveLength(3)
      expect(targetEdges[0]?.targetHandle).toBe('input-left-0')
      expect(targetEdges[1]?.targetHandle).toBe('input-left-1')
      expect(targetEdges[2]?.targetHandle).toBe('input-left-2')
    })
  })
})