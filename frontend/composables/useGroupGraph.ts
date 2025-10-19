import type { Node, Edge } from '@vue-flow/core'
import type { GroupConnection } from '~/generated/api/src'

/**
 * Build Vue Flow nodes and edges from group connection data
 */
export function useGroupGraph() {

  function buildGraphFromConnections(connections: GroupConnection[]): { nodes: Node[], edges: Edge[] } {
    const tempNodes: Node[] = []
    const tempEdges: Edge[] = []
    const edgeSet = new Set<string>() // Prevent duplicate edges

    // Calculate grid layout
    const cols = Math.ceil(Math.sqrt(connections.length))

    // Create nodes for each group
    connections.forEach((group, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols

      tempNodes.push({
        id: group.groupName || '',
        type: 'group-node',
        position: { x: col * 250, y: row * 150 },
        data: {
          label: group.displayName || group.groupName || '',
          serviceCount: group.serviceCount || 0
        }
      })

      // Create edges for connections
      // Handle both array and Set types from backend
      const connectedGroups = group.connectedToGroups
        ? Array.isArray(group.connectedToGroups)
          ? group.connectedToGroups
          : Array.from(group.connectedToGroups)
        : []

      console.log(`Group ${group.groupName} connects to:`, connectedGroups)

      connectedGroups.forEach((targetGroup: string) => {
        const edgeId = `${group.groupName}-${targetGroup}`

        // Only add if both nodes exist and edge doesn't already exist
        if (!edgeSet.has(edgeId)) {
          tempEdges.push({
            id: edgeId,
            source: group.groupName || '',
            target: targetGroup,
            sourceHandle: 'source-right',
            targetHandle: 'target-left',
            type: 'smoothstep',
            animated: true
          })
          edgeSet.add(edgeId)
          console.log(`Created edge: ${edgeId}`)
        }
      })
    })

    console.log('Graph built:', {
      nodeCount: tempNodes.length,
      edgeCount: tempEdges.length,
      nodes: tempNodes.map(n => n.id),
      edges: tempEdges.map(e => `${e.source}->${e.target}`)
    })

    return { nodes: tempNodes, edges: tempEdges }
  }

  return {
    buildGraphFromConnections
  }
}
