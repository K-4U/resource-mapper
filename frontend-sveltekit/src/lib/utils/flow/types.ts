import type { Edge, Node } from '@xyflow/svelte'
import type { GroupInfo, ServiceDefinition } from '$lib/types'

export type FlowNodeKind = 'group' | 'service' | 'external'

export interface FlowNodeData extends Record<string, unknown> {
  label: string
  subLabel?: string
  iconPath?: string | null
  groupId?: string
  serviceId?: string
  kind: FlowNodeKind
  direction?: 'incoming' | 'outgoing'
  isPlaceholder?: boolean
}

export interface FlowEdgeData extends Record<string, unknown> {
  label?: string
  connectionType?: string
  direction?: 'incoming' | 'outgoing' | 'internal'
}

export interface RawFlowNode {
  id: string
  width?: number
  height?: number
  data: FlowNodeData
  className?: string
  selectable?: boolean
  style?: Record<string, string>
}

export interface RawFlowEdge {
  id: string
  source: string
  target: string
  label?: string
  data?: FlowEdgeData
  animated?: boolean
  style?: Record<string, string>
}

export interface FlowGraphInput {
  nodes: RawFlowNode[]
  edges: RawFlowEdge[]
  signature: string
}

export interface FlowGraphOutput {
  nodes: Node<FlowNodeData>[]
  edges: Edge<FlowEdgeData>[]
  signature: string
}

export interface GroupServicesGraphResult {
  graph: FlowGraphInput
  serviceNodes: Record<string, ServiceDefinition>
  externalNodes: Record<string, { service: ServiceDefinition; group: GroupInfo }>
}
