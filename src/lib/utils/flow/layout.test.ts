import { describe, it, expect } from 'vitest'
import type { Edge, Node } from '@xyflow/svelte'
import { layoutFlowGraph } from './layout'
import type { FlowEdgeData, FlowGraphInput, FlowNodeData } from '$lib/utils/flow/types'

// Basic helpers to build nodes/edges with minimal required data
function serviceNode(id: string, label = id, serviceType?: string, position = { x: 0, y: 0 }): Node<FlowNodeData> {
  return {
    id,
    data: { label, kind: 'service', serviceType },
    position
  } as unknown as Node<FlowNodeData>
}

function groupNode(id: string, label = id, position = { x: 0, y: 0 }): Node<FlowNodeData> {
  return {
    id,
    data: { label, kind: 'group' },
    position
  } as unknown as Node<FlowNodeData>
}

function edge(id: string, source: string, target: string, data: FlowEdgeData = {}): Edge<FlowEdgeData> {
  return {
    id,
    source,
    target,
    data
  } as Edge<FlowEdgeData>
}

// Silence verbose debug logs during tests
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}
// @ts-expect-error allow override in test env
console.debug = noop
// @ts-expect-error allow override in test env
console.log = noop

describe('layoutFlowGraph', () => {
  it('returns positions for nodes and preserves signature', async () => {
    const input: FlowGraphInput = {
      groupNodes: [],
      serviceNodes: [serviceNode('s1', 'Service 1')],
      edges: [],
      signature: 'sig-1'
    }

    const out = await layoutFlowGraph(input)

    expect(out.signature).toBe(input.signature)
    expect(out.nodes.length).toBeGreaterThanOrEqual(1)

    const n = out.nodes.find((x) => x.id === 's1')
    expect(n).toBeTruthy()
    expect(n?.position?.x).toBeDefined()
    expect(n?.position?.y).toBeDefined()
  })

  it('keeps nodes and edges ids and data', async () => {
    const input: FlowGraphInput = {
      groupNodes: [],
      serviceNodes: [serviceNode('a', 'Service A', 'lambda'), serviceNode('b', 'Service B', 'sqs')],
      edges: [edge('e1', 'a', 'b', { label: 'A->B', direction: 'outgoing' })],
      signature: 'sig-2'
    }

    const out = await layoutFlowGraph(input)

    // Nodes should be present
    const nodeA = out.nodes.find((n) => n.id === 'a')
    const nodeB = out.nodes.find((n) => n.id === 'b')
    expect(nodeA).toBeTruthy()
    expect(nodeB).toBeTruthy()

    // Verify component-specific data is preserved
    expect(nodeA?.data.label).toBe('Service A')
    expect(nodeA?.data.serviceType).toBe('lambda')
    expect(nodeB?.data.serviceType).toBe('sqs')

    // Edge should be preserved with same ids and data
    expect(out.edges.length).toBe(1)
    const e = out.edges[0]
    expect(e.id).toBe('e1')
    expect(e.source).toBe('a')
    expect(e.target).toBe('b')
    expect(e.data?.label).toBe('A->B')
    expect(e.data?.direction).toBe('outgoing')
  })

  it('handles a simple group with a child service node', async () => {
    const g = groupNode('g1', 'Group 1')
    const s = { ...serviceNode('s1', 'Service in group'), parentId: 'g1' } as unknown as Node<FlowNodeData>

    const input: FlowGraphInput = {
      groupNodes: [g],
      serviceNodes: [s],
      edges: [],
      signature: 'sig-3'
    }

    const out = await layoutFlowGraph(input)

    // Expect both the group and the service node to be present in flattened output
    const groupOut = out.nodes.find((n) => n.id === 'g1')
    const childOut = out.nodes.find((n) => n.id === 's1')

    expect(groupOut).toBeTruthy()
    expect(childOut).toBeTruthy()

    // Both should have positions
    expect(groupOut?.position?.x).toBeDefined()
    expect(groupOut?.position?.y).toBeDefined()
    expect(childOut?.position?.x).toBeDefined()
    expect(childOut?.position?.y).toBeDefined()
  })
})
