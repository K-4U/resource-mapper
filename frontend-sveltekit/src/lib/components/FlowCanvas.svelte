<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable, type Writable } from 'svelte/store'
  import type { Edge, Node, NodeTypes } from '@xyflow/svelte'
  import { SvelteFlow, Background, BackgroundVariant } from '@xyflow/svelte'
  import DiagramToolbar from '$lib/components/DiagramToolbar.svelte'
  import Legend from '$lib/components/Legend.svelte'
  import { layoutFlowGraph } from '$lib/utils/flow/layout'
  import type { FlowEdgeData, FlowGraphInput, FlowNodeData } from '$lib/utils/flow/types'
  import GroupNode from '$lib/components/flow/GroupNode.svelte'
  import ServiceNode from '$lib/components/flow/ServiceNode.svelte'
  import ExternalNode from '$lib/components/flow/ExternalNode.svelte'

  const DOUBLE_CLICK_THRESHOLD = 400

  export let graph: FlowGraphInput | null = null
  export let pending = false
  export let label = ''
  export let showToolbar = true

  const dispatch = createEventDispatcher<{
    nodeClick: string
    nodeDoubleClick: string
    goHome: void
  }>()

  const nodeTypes = { group: GroupNode, service: ServiceNode, external: ExternalNode } as NodeTypes
  const nodes: Writable<Node[]> = writable<Node[]>([])
  const edges: Writable<Edge[]> = writable<Edge[]>([])

  let isDarkMode = false
  let showLegend = true
  let emptyStateLabel = 'No diagram available.'
  let lastClickedNode: string | null = null
  let lastClickTimestamp = 0
  let layoutError = ''
  let layoutBusy = false
  let graphReady = false
  let currentSignature = ''
  let flowKey = 0
  let showOverlay = true
  let hasGraphData = false

  onMount(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('preferredTheme') : null
    if (stored === 'dark') {
      isDarkMode = true
      document.documentElement.classList.add('dark')
    }
  })

  $: targetSignature = graph?.signature ?? ''
  $: if (targetSignature !== currentSignature || (!graph && currentSignature !== '')) {
    runLayout(graph, targetSignature)
  }
  $: hasGraphData = !!graph && graph.nodes.length > 0
  $: showOverlay = pending || layoutBusy || !graphReady
  $: console.debug('[FlowCanvas] overlay state', { showOverlay, pending, layoutBusy, graphReady })

  async function runLayout(sourceGraph: FlowGraphInput | null, signature: string) {
    layoutError = ''
    graphReady = false
    console.debug('[FlowCanvas] runLayout start', { hasGraph: !!sourceGraph, signature })
    if (!sourceGraph) {
      nodes.set([])
      edges.set([])
      emptyStateLabel = pending ? 'Rendering diagram…' : 'No diagram available.'
      currentSignature = signature
      flowKey += 1
      console.debug('[FlowCanvas] runLayout skipped - no graph data')
      return
    }
    layoutBusy = true
    try {
      const result = await layoutFlowGraph(sourceGraph)
      if (result.signature !== signature) {
        console.debug('[FlowCanvas] runLayout result ignored due to stale signature', {
          expected: signature,
          received: result.signature
        })
        return
      }
      nodes.set(result.nodes as Node[])
      edges.set(result.edges as Edge[])
      currentSignature = result.signature
      flowKey += 1
      graphReady = true
      console.debug('[FlowCanvas] runLayout complete', { nodeCount: result.nodes.length, edgeCount: result.edges.length })
    } catch (error) {
      layoutError = error instanceof Error ? error.message : 'Failed to lay out diagram.'
      console.error('[FlowCanvas] layout error', error)
      nodes.set([])
      edges.set([])
      graphReady = false
    } finally {
      layoutBusy = false
      console.debug('[FlowCanvas] runLayout finished', { graphReady, layoutBusy })
    }
  }

  function handleFlowNodeClick(event: CustomEvent<{ node?: { id?: string } }>) {
    const nodeId = event.detail?.node?.id
    if (!nodeId) return
    const now = Date.now()
    if (lastClickedNode === nodeId && now - lastClickTimestamp <= DOUBLE_CLICK_THRESHOLD) {
      dispatch('nodeDoubleClick', nodeId)
      lastClickedNode = null
      lastClickTimestamp = 0
      return
    }
    lastClickedNode = nodeId
    lastClickTimestamp = now
    dispatch('nodeClick', nodeId)
  }

  function toggleLegend() {
    showLegend = !showLegend
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('preferredTheme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('preferredTheme', 'light')
    }
  }

  function logDiagram() {
    if (!graph) {
      console.info('[FlowCanvas] No diagram to log yet')
      return
    }
    console.info('[FlowCanvas graph]', graph)
  }

  function handleToolbarHome() {
    dispatch('goHome')
  }
</script>

<div data-testid="flow-canvas" class="relative flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-950 to-slate-900">
  {#if showToolbar}
    <DiagramToolbar
      pending={showOverlay}
      {label}
      {showLegend}
      {isDarkMode}
      on:goHome={handleToolbarHome}
      on:toggleLegend={toggleLegend}
      on:toggleDarkMode={toggleDarkMode}
      on:logDiagram={logDiagram}
    />
  {/if}

  <div class="relative flex-1 overflow-hidden">
    {#if hasGraphData}
      {#key flowKey}
        <SvelteFlow
          class="h-full w-full"
          nodes={nodes}
          edges={edges}
          {nodeTypes}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          panOnScroll={true}
          selectionOnDrag={false}
          nodeClickDistance={2}
          colorMode={isDarkMode ? 'dark' : 'light'}
          fitView={true}
          fitViewOptions={{ padding: 0.2 }}
          on:nodeclick={handleFlowNodeClick}
        >
          <Background bgColor={isDarkMode ? '#1f2937' : '#e5e7eb'} variant={BackgroundVariant.Lines} gap={24} />
        </SvelteFlow>
      {/key}
    {:else}
      <div class="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-400">
        <span class="text-3xl" aria-hidden="true">🌀</span>
        <span>{emptyStateLabel}</span>
      </div>
    {/if}

    {#if showOverlay}
      <div
        data-testid="flow-loading-overlay"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-gray-200 backdrop-blur"
      >
        Rendering diagram…
      </div>
    {/if}

    {#if showLegend && !showOverlay}
      <div class="pointer-events-none absolute bottom-4 right-4"><Legend /></div>
    {/if}
  </div>

  {#if layoutError}
    <div class="border-t border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{layoutError}</div>
  {/if}
</div>
