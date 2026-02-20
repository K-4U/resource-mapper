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

  it('keeps nodes and edges ids and data; provides edge points', async () => {
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

    // Edge should be preserved with same ids and data and enriched with points
    expect(out.edges.length).toBe(1)
    const e = out.edges[0]
    expect(e.id).toBe('e1')
    expect(e.source).toBe('a')
    expect(e.target).toBe('b')
    expect(e.data?.label).toBe('A->B')
    expect(e.data?.direction).toBe('outgoing')

    // Points array should exist and contain at least start and end
    // ELK typically returns at least two points; be lenient but ensure array exists
    expect(Array.isArray((e.data as any).points)).toBe(true)
    expect(((e.data as any).points as any[]).length).toBeGreaterThanOrEqual(2)
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

  it('recalculates edges but preserves node positions when edgesOnly is true', async () => {
    const s1 = serviceNode('s1', 'S1', 'lambda', { x: 100, y: 100 })
    const s2 = serviceNode('s2', 'S2', 'sqs', { x: 500, y: 500 })
    const e1 = edge('e1', 's1', 's2')

    const input: FlowGraphInput = {
      groupNodes: [],
      serviceNodes: [s1, s2],
      edges: [e1],
      signature: 'sig-edges-only'
    }

    const out = await layoutFlowGraph(input, true)

    const outS1 = out.nodes.find((n) => n.id === 's1')
    const outS2 = out.nodes.find((n) => n.id === 's2')

    // Node positions should be EXACTLY what we fed it
    expect(outS1?.position?.x).toBe(100)
    expect(outS1?.position?.y).toBe(100)
    expect(outS2?.position?.x).toBe(500)
    expect(outS2?.position?.y).toBe(500)

    // Edge should have points
    const outE1 = out.edges.find((e) => e.id === 'e1')
    expect(outE1?.data?.points).toBeDefined()
    expect(Array.isArray(outE1?.data?.points)).toBe(true)
    expect((outE1?.data?.points as any[]).length).toBeGreaterThanOrEqual(2)
  })
})
