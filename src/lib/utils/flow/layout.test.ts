import { describe, it, expect } from 'vitest'
import type { Edge, Node } from '@xyflow/svelte'
import { layoutFlowGraph, calculateEdgeOffset, OFFSET_STEP } from './layout'
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

describe('calculateEdgeOffset', () => {
  it('returns 0 for a single edge', () => {
    const nodes: Node<FlowNodeData>[] = [serviceNode('s1'), serviceNode('t1')]
    const edges: Edge<FlowEdgeData>[] = [
      { id: 'e1', source: 's1', target: 't1', sourceHandle: 'output', targetHandle: 'input' } as Edge<FlowEdgeData>
    ]

    expect(calculateEdgeOffset('e1', nodes, edges, true)).toBe(0)
    expect(calculateEdgeOffset('e1', nodes, edges, false)).toBe(0)
  })

  it('spreads multiple edges and sorts them by target position', () => {
    const nodes: Node<FlowNodeData>[] = [
      serviceNode('s1', 'Source', undefined, { x: 0, y: 100 }),
      serviceNode('t1', 'Top Target', undefined, { x: 200, y: 0 }),
      serviceNode('t2', 'Bottom Target', undefined, { x: 200, y: 200 })
    ]
    const edges: Edge<FlowEdgeData>[] = [
      { id: 'e_to_t1', source: 's1', target: 't1', sourceHandle: 'output' } as Edge<FlowEdgeData>,
      { id: 'e_to_t2', source: 's1', target: 't2', sourceHandle: 'output' } as Edge<FlowEdgeData>
    ]

    // e_to_t1 connects to t1 (y=0)
    // e_to_t2 connects to t2 (y=200)
    // Sorted order: e_to_t1, e_to_t2
    // index for e_to_t1 = 0. index for e_to_t2 = 1.
    // offsets = (index - 0.5) * OFFSET_STEP

    expect(calculateEdgeOffset('e_to_t1', nodes, edges, true)).toBe(-OFFSET_STEP / 2)
    expect(calculateEdgeOffset('e_to_t2', nodes, edges, true)).toBe(OFFSET_STEP / 2)
  })

  it('spreads three edges correctly', () => {
    const nodes: Node<FlowNodeData>[] = [
      serviceNode('s1', 'Source', undefined, { x: 0, y: 100 }),
      serviceNode('t1', 'T1', undefined, { x: 200, y: 0 }),
      serviceNode('t2', 'T2', undefined, { x: 200, y: 100 }),
      serviceNode('t3', 'T3', undefined, { x: 200, y: 200 })
    ]
    const edges: Edge<FlowEdgeData>[] = [
      { id: 'e1', source: 's1', target: 't1', sourceHandle: 'output' } as Edge<FlowEdgeData>,
      { id: 'e2', source: 's1', target: 't2', sourceHandle: 'output' } as Edge<FlowEdgeData>,
      { id: 'e3', source: 's1', target: 't3', sourceHandle: 'output' } as Edge<FlowEdgeData>
    ]

    // Sorted order: e1 (y=0), e2 (y=100), e3 (y=200)
    // index: 0, 1, 2. (n-1)/2 = 1.
    // offsets: (0-1)*OFFSET_STEP, (1-1)*OFFSET_STEP, (2-1)*OFFSET_STEP

    expect(calculateEdgeOffset('e1', nodes, edges, true)).toBe(-OFFSET_STEP)
    expect(calculateEdgeOffset('e2', nodes, edges, true)).toBe(0)
    expect(calculateEdgeOffset('e3', nodes, edges, true)).toBe(OFFSET_STEP)
  })

  it('correctly calculates offsets for nodes in groups vs orphans using absolute coordinates', () => {
    // Node 1 (orphan) at x=10, y=60
    // Group 1 at x=422, y=67
    // Node 2 (child of Group 1) at x=10, y=160 (relative) -> Abs: y = 67 + 160 = 227
    // Node 3 (child of Group 1) at x=350, y=260 (relative) -> Abs: y = 67 + 260 = 327
    // Edges: Node 1 -> Node 3 (e1), Node 2 -> Node 3 (e2)
    // Both connect to Node 3's input handle (target).
    const nodes: Node<FlowNodeData>[] = [
      serviceNode('n1', 'Orphan', undefined, { x: 10, y: 60 }),
      groupNode('g1', 'Group 1', { x: 422, y: 67 }),
      { ...serviceNode('n2', 'Child 2', undefined, { x: 10, y: 160 }), parentId: 'g1' } as Node<FlowNodeData>,
      { ...serviceNode('n3', 'Target 3', undefined, { x: 350, y: 260 }), parentId: 'g1' } as Node<FlowNodeData>
    ]
    const edges: Edge<FlowEdgeData>[] = [
      { id: 'e1', source: 'n1', target: 'n3', targetHandle: 'input' } as Edge<FlowEdgeData>,
      { id: 'e2', source: 'n2', target: 'n3', targetHandle: 'input' } as Edge<FlowEdgeData>
    ]

    // Absolute positions:
    // n1 (abs y=60)
    // n2 (abs y=67+160=227)
    // Both are sources of Node 3.
    // Order should be e1 (60), e2 (227).
    // Offset for e1: -4, Offset for e2: 4.
    // This confirms n1's edge is "above" n2's edge (smaller Y offset).
    // The user said: "verify if the connection coming from the second node is above of the connection coming from the first node."
    // Maybe the user meant if it WAS above? No, I'll just check if e1 is above e2.

    const offset1 = calculateEdgeOffset('e1', nodes, edges, false) // target offset for e1
    const offset2 = calculateEdgeOffset('e2', nodes, edges, false) // target offset for e2

    // Expected: offset1 < offset2 because n1 (abs 60) < n2 (abs 227)
    expect(offset1).toBe(-OFFSET_STEP / 2)
    expect(offset2).toBe(OFFSET_STEP / 2)

    // Now if the parent was at y=-200
    // n2 (abs y=-200+160=-40)
    // n1 (abs y=60)
    // Now n2 is HIGHER than n1.
    // Order should be e2 (-40), e1 (60).
    // Offset for e2: -4, Offset for e1: 4.
    const nodes2: Node<FlowNodeData>[] = [
      serviceNode('n1', 'Orphan', undefined, { x: 10, y: 60 }),
      groupNode('g1', 'Group 1', { x: 422, y: -200 }),
      { ...serviceNode('n2', 'Child 2', undefined, { x: 10, y: 160 }), parentId: 'g1' } as Node<FlowNodeData>,
      { ...serviceNode('n3', 'Target 3', undefined, { x: 350, y: 260 }), parentId: 'g1' } as Node<FlowNodeData>
    ]

    const offset1_neg = calculateEdgeOffset('e1', nodes2, edges, false)
    const offset2_neg = calculateEdgeOffset('e2', nodes2, edges, false)

    // Expected: offset2_neg < offset1_neg because n2 (abs -40) < n1 (abs 60)
    expect(offset2_neg).toBe(-OFFSET_STEP / 2)
    expect(offset1_neg).toBe(OFFSET_STEP / 2)
  })
})



describe('calculateEdgeOffset - bidirectional edges', () => {
  it('offsets opposite-direction edges between the same two nodes (split around center)', () => {
    const nodes: Node<FlowNodeData>[] = [
      serviceNode('a', 'A', undefined, { x: 0, y: 100 }),
      serviceNode('b', 'B', undefined, { x: 200, y: 150 })
    ]

    const edges: Edge<FlowEdgeData>[] = [
      { id: 'e_ab', source: 'a', target: 'b', sourceHandle: 'output', targetHandle: 'input' } as Edge<FlowEdgeData>,
      { id: 'e_ba', source: 'b', target: 'a', sourceHandle: 'output', targetHandle: 'input' } as Edge<FlowEdgeData>
    ]

    // Deterministic order by other-node position then by edge id: 'e_ab' comes before 'e_ba'
    // Expect 'e_ab' to get the top/left offset (-step/2) and 'e_ba' the bottom/right (+step/2)

    // Node A side
    expect(calculateEdgeOffset('e_ab', nodes, edges, true)).toBe(-OFFSET_STEP / 2)  // A:output
    expect(calculateEdgeOffset('e_ba', nodes, edges, false)).toBe(OFFSET_STEP / 2)  // A:input

    // Node B side
    expect(calculateEdgeOffset('e_ab', nodes, edges, false)).toBe(-OFFSET_STEP / 2) // B:input
    expect(calculateEdgeOffset('e_ba', nodes, edges, true)).toBe(OFFSET_STEP / 2)   // B:output
  })

  it('provides distinct offsets for three parallel edges between same nodes', () => {
    const nodes: Node<FlowNodeData>[] = [
      serviceNode('a', 'A', undefined, { x: 0, y: 100 }),
      serviceNode('b', 'B', undefined, { x: 400, y: 100 })
    ]

    const edges: Edge<FlowEdgeData>[] = [
      { id: 'e1', source: 'a', target: 'b', sourceHandle: 'output', targetHandle: 'input' } as Edge<FlowEdgeData>,
      { id: 'e2', source: 'a', target: 'b', sourceHandle: 'output', targetHandle: 'input' } as Edge<FlowEdgeData>,
      { id: 'e3', source: 'a', target: 'b', sourceHandle: 'output', targetHandle: 'input' } as Edge<FlowEdgeData>
    ]

    const o1 = calculateEdgeOffset('e1', nodes, edges, true)
    const o2 = calculateEdgeOffset('e2', nodes, edges, true)
    const o3 = calculateEdgeOffset('e3', nodes, edges, true)

    const offsets = [o1, o2, o3].sort((a, b) => a - b)
    expect(offsets).toEqual([-OFFSET_STEP, 0, OFFSET_STEP])
  })

  it('provides distinct trunk offsets for independent edges in the same horizontal lane', () => {
    // Edge 1: n1 -> n2 (x: 0->400, y: 100)
    // Edge 2: n3 -> n4 (x: 50->350, y: 120)
    // These edges are independent but their X-spans overlap, and they are in the same lane.
    const nodes: Node<FlowNodeData>[] = [
      serviceNode('n1', 'N1', undefined, { x: 0, y: 100 }),
      serviceNode('n2', 'N2', undefined, { x: 400, y: 100 }),
      serviceNode('n3', 'N3', undefined, { x: 50, y: 120 }),
      serviceNode('n4', 'N4', undefined, { x: 350, y: 120 })
    ]

    const edges: Edge<FlowEdgeData>[] = [
      { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'output', targetHandle: 'input' } as Edge<FlowEdgeData>,
      { id: 'e2', source: 'n3', target: 'n4', sourceHandle: 'output', targetHandle: 'input' } as Edge<FlowEdgeData>
    ]

    // isTrunk = true
    const o1 = calculateEdgeOffset('e1', nodes, edges, true, true)
    const o2 = calculateEdgeOffset('e2', nodes, edges, true, true)

    // Midpoints: e1 (y=100), e2 (y=120)
    // Sorted: e1, e2. Offsets: -4, 4
    expect(o1).toBe(-OFFSET_STEP / 2)
    expect(o2).toBe(OFFSET_STEP / 2)
  })
})
