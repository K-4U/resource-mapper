import type { GroupInfo, ServiceDefinition } from './types.js'

export type FlowNodeKind = 'group' | 'service' | 'external' | 'mainGroup'

export interface GraphNode<T = any> {
  id: string
  position: { x: number; y: number }
  data?: T
  type?: string
  width?: number
  height?: number
  parentId?: string
  hidden?: boolean
  [key: string]: any
}

export interface GraphEdge<T = any> {
  id: string
  source: string
  target: string
  data?: T
  type?: string
  label?: string
  sourceHandle?: string | null
  targetHandle?: string | null
  hidden?: boolean
  [key: string]: any
}

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
  groupNodes: GraphNode<FlowNodeData>[]
  serviceNodes: GraphNode<FlowNodeData>[]
  edges: GraphEdge<FlowEdgeData>[]
  signature: string
}

export interface FlowGraphOutput {
  nodes: GraphNode<FlowNodeData>[]
  edges: GraphEdge<FlowEdgeData>[]
  signature: string
}

export interface ServicesGraphResult {
  graph: FlowGraphInput
  serviceNodes: Record<string, ServiceDefinition>
  externalNodes: Record<string, { service: ServiceDefinition; group: GroupInfo }>
}
