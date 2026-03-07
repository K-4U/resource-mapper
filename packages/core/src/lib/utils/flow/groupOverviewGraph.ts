import type {GroupConnection, GroupInfo} from '$shared/types'
import type {FlowEdgeData, FlowGraphInput, FlowNodeData, GraphEdge, GraphNode} from '$shared/flow-types'
import {createGraphSignature, formatConnectionLabel, sanitizeNodeId} from '$lib/utils/flow/helpers'

export interface GroupOverviewGraphResult {
  graph: FlowGraphInput | null
  nodeToGroupMap: Record<string, string>
}

export function buildGroupOverviewGraph(
  groups: Record<string, GroupInfo>,
  connections: GroupConnection[] = []
): GroupOverviewGraphResult {
  if (!groups || Object.keys(groups).length === 0) {
    return { graph: null, nodeToGroupMap: {} }
  }

  // Convert each group into a diagram node
  const nodes: GraphNode<FlowNodeData>[] = Object.entries(groups).map(([groupId, groupInfo]) => ({
    id: sanitizeNodeId(groupId, 'mainGroup'),
    type: 'mainGroup',
    data: {
      label: groupInfo.name,
      subLabel: groupInfo.description ?? groupId,
      groupId,
      kind: 'mainGroup'
    },
    width: 120,
    height: 80,
    position: { x: 0, y: 0 },
  }))

    // Convert each connection into a diagram edge
    const edges: GraphEdge<FlowEdgeData>[] = connections.map((connection, index) => {
        const sourceId = sanitizeNodeId(connection.sourceGroup, 'mainGroup')
        const targetId = sanitizeNodeId(connection.targetGroup, 'mainGroup')
        return {
            id: `edge_${sourceId}_${targetId}_${index}`,
            source: sourceId,
            sourceHandle: 'output',
            target: targetId,
            targetHandle: 'input',
            type: 'snake',
            label: formatConnectionLabel(connection.connectionCount),
            data: {
                label: formatConnectionLabel(connection.connectionCount),
            }
        }
    })

  // Create a unique signature for the graph for caching/change detection
  const signature = createGraphSignature('group-overview', {
    groups: nodes.map(node => node.data?.groupId).sort(),
    connections: connections.map(connection => ({
      sourceGroup: connection.sourceGroup,
      targetGroup: connection.targetGroup,
      connectionCount: connection.connectionCount
    }))
  })

  const graph: FlowGraphInput = { groupNodes: [], serviceNodes: nodes, edges, signature }
  // Map diagram node IDs back to group IDs for UI interaction
  const nodeToGroupMap = nodes.reduce<Record<string, string>>((lookup, node) => {
    if (node.data?.groupId) {
      lookup[node.id] = node.data.groupId
    }
    return lookup
  }, {})

    console.debug(graph)
  return { graph, nodeToGroupMap }
}
