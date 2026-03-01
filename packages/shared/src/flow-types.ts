import type { Edge, Node } from '@xyflow/svelte'
import type { GroupInfo, ServiceDefinition } from '@resource-mapper/shared'

export type FlowNodeKind = 'group' | 'service' | 'external' | 'mainGroup'

export interface FlowNodeData extends Record<string, unknown> {
  label: string
  subLabel?: string
  serviceType?: string
  groupId?: string
  serviceId?: string
  kind: FlowNodeKind
  direction?: 'incoming' | 'outgoing'
  isPlaceholder?: boolean
}

export interface FlowEdgeData extends Record<string, unknown> {
  label?: string
  connectionType?: string
  direction?: 'incoming' | 'outgoing' | 'internal',
  sourcePosition?: { x: number; y: number },
  targetPosition?: { x: number; y: number },
}

export interface FlowGraphInput {
  groupNodes: Node<FlowNodeData>[]
  serviceNodes: Node<FlowNodeData>[]
  edges: Edge<FlowEdgeData>[]
  signature: string
}

export interface FlowGraphOutput {
  nodes: Node<FlowNodeData>[]
  edges: Edge<FlowEdgeData>[]
  signature: string
}

export interface ServicesGraphResult {
  graph: FlowGraphInput
  serviceNodes: Record<string, ServiceDefinition>
  externalNodes: Record<string, { service: ServiceDefinition; group: GroupInfo }>
}
