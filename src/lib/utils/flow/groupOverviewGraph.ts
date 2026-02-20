// groupOverviewGraph.ts
//
// This module is responsible for transforming the raw group and connection data from the backend/services
// into a format that is directly consumable by the SvelteFlow diagram engine. It is a key part of the data
// layer that separates business logic from UI rendering logic.
//
// Why is this file needed?
// - It acts as an adapter between the domain model (groups, connections) and the diagram view model (nodes, edges).
// - It ensures that all IDs, labels, and edge data are properly sanitized and formatted for the diagram engine.
// - It generates a unique signature for the graph, which is used for caching, change detection, and efficient updates.
// - It provides a mapping from diagram node IDs back to group IDs, which is essential for UI interactions (e.g., clicking a node to show group details).
// - Without this file, the UI would be tightly coupled to the backend/service data structures, making the code harder to maintain, test, and extend.
// - This separation allows the diagram rendering to evolve independently from the backend data model, and vice versa.
//
// In summary: This file is VERY MUCH needed because it is the single source of truth for how group and connection data
// is represented in the diagram, and it enables a clean, maintainable, and testable architecture.

import type {GroupConnection, GroupInfo} from '$lib/types'
import type {FlowEdgeData, FlowGraphInput, FlowNodeData} from '$lib/utils/flow/types'
import {createGraphSignature, formatConnectionLabel, sanitizeNodeId} from '$lib/utils/flow/helpers'
import type {Edge, Node} from "@xyflow/svelte"

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
  const nodes: Node<FlowNodeData>[] = Object.entries(groups).map(([groupId, groupInfo]) => ({
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
    const edges: Edge<FlowEdgeData>[] = connections.map((connection, index) => {
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
    groups: nodes.map(node => node.data.groupId).sort(),
    connections: connections.map(connection => ({
      sourceGroup: connection.sourceGroup,
      targetGroup: connection.targetGroup,
      connectionCount: connection.connectionCount
    }))
  })

  const graph: FlowGraphInput = { groupNodes: [], serviceNodes: nodes, edges, signature }
  // Map diagram node IDs back to group IDs for UI interaction
  const nodeToGroupMap = nodes.reduce<Record<string, string>>((lookup, node) => {
    if (node.data.groupId) {
      lookup[node.id] = node.data.groupId
    }
    return lookup
  }, {})

  return { graph, nodeToGroupMap }
}
