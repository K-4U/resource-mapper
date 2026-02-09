import type { GroupConnection, GroupInfo } from '$lib/types'
import type { FlowGraphInput, RawFlowEdge, RawFlowNode } from '$lib/utils/flow/types'
import { createGraphSignature, formatConnectionLabel, sanitizeNodeId } from '$lib/utils/flow/helpers'

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

  const nodes: RawFlowNode[] = Object.entries(groups).map(([groupId, groupInfo]) => ({
    id: sanitizeNodeId(groupId, 'group'),
    width: 260,
    height: 120,
    data: {
      label: groupInfo.name,
      subLabel: groupInfo.description ?? groupId,
      groupId,
      kind: 'group'
    }
  }))

  const edges: RawFlowEdge[] = connections.map((connection, index) => {
    const sourceId = sanitizeNodeId(connection.sourceGroup, 'group')
    const targetId = sanitizeNodeId(connection.targetGroup, 'group')
    return {
      id: `edge_${sourceId}_${targetId}_${index}`,
      source: sourceId,
      target: targetId,
      label: formatConnectionLabel(connection.connectionCount),
      data: {
        label: formatConnectionLabel(connection.connectionCount),
        direction: 'internal'
      }
    }
  })

  const signature = createGraphSignature('group-overview', {
    groups: nodes.map(node => node.data.groupId).sort(),
    connections: connections.map(connection => ({
      sourceGroup: connection.sourceGroup,
      targetGroup: connection.targetGroup,
      connectionCount: connection.connectionCount
    }))
  })

  const graph: FlowGraphInput = { nodes, edges, signature }
  const nodeToGroupMap = nodes.reduce<Record<string, string>>((lookup, node) => {
    if (node.data.groupId) {
      lookup[node.id] = node.data.groupId
    }
    return lookup
  }, {})

  return { graph, nodeToGroupMap }
}

