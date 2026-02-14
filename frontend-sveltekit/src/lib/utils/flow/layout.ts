import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'
import type { Edge, Node } from '@xyflow/svelte'
import { MarkerType } from '@xyflow/svelte'
import type {
  FlowEdgeData,
  FlowGraphInput,
  FlowGraphOutput,
  FlowNodeData,
  RawFlowEdge,
  RawFlowNode
} from '$lib/utils/flow/types'

const elk = new ELK()

const DEFAULT_NODE_SIZE = { width: 220, height: 120 }
const GROUP_NODE_SIZE = { width: 300, height: 150 }
const EXTERNAL_NODE_SIZE = { width: 260, height: 130 }
const SERVICE_NODE_SIZE = { width: 240, height: 120 }

const ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.spacing.nodeNode': '60',
  'elk.direction': 'RIGHT',
  'elk.layered.compaction.postCompaction.strategy': 'LEFT'
}

export async function layoutFlowGraph(input: FlowGraphInput): Promise<FlowGraphOutput> {
  const elkGraph = {
    id: 'root',
    layoutOptions: ELK_OPTIONS,
    children: input.nodes.map(mapNodeToElk),
    edges: input.edges.map(mapEdgeToElk)
  }

  const { children = [], edges = [] } = await elk.layout(elkGraph)

  const positionedNodes: Node<FlowNodeData>[] = input.nodes.map(node => {
    const layoutNode = children.find(child => child.id === node.id)
    const fallbackSize = resolveNodeSize(node)
    return {
      id: node.id,
      type: node.data.kind === 'group' ? 'group' : node.data.kind === 'service' ? 'service' : 'external',
      data: node.data,
      position: {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0
      },
      style: toInlineStyle(node.style),
      selectable: node.selectable ?? true,
      class: node.className,
      width: layoutNode?.width ?? node.width ?? fallbackSize.width,
      height: layoutNode?.height ?? node.height ?? fallbackSize.height
    }
  })

  const positionedEdges: Edge<FlowEdgeData>[] = input.edges.map(edge => {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ?? edge.data?.label,
      type: 'smoothstep',
      animated: edge.animated,
      style: toInlineStyle(edge.style),
      data: edge.data,
      markerEnd: { type: MarkerType.ArrowClosed }
    }
  })

  return { nodes: positionedNodes, edges: positionedEdges, signature: input.signature }
}

function mapNodeToElk(node: RawFlowNode): ElkNode {
  const size = resolveNodeSize(node)
  return {
    id: node.id,
    width: node.width ?? size.width,
    height: node.height ?? size.height
  }
}

function mapEdgeToElk(edge: RawFlowEdge): ElkExtendedEdge {
  return {
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target]
  }
}

function toInlineStyle(style?: Record<string, string>) {
  if (!style) {
    return undefined
  }
  return Object.entries(style)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

function resolveNodeSize(node: RawFlowNode) {
  switch (node.data.kind) {
    case 'group':
      return GROUP_NODE_SIZE
    case 'external':
      return EXTERNAL_NODE_SIZE
    case 'service':
    default:
      return SERVICE_NODE_SIZE
  }
}
