<script lang="ts">
  import {createEventDispatcher, onMount} from 'svelte'
  import {
    Background,
    BackgroundVariant,
    Controls,
    type Edge,
    type EdgeTypes,
    MiniMap,
    type Node,
    type NodeTypes,
    Panel,
    SvelteFlow
  } from '@xyflow/svelte'
  import Legend from '$lib/components/Legend.svelte'
  import {layoutFlowGraph} from '$lib/utils/flow/layout'
  import type {FlowGraphInput} from '$lib/utils/flow/types'
  import GroupNode from '$lib/components/flow/GroupNode.svelte'
  import ServiceNode from '$lib/components/flow/ServiceNode.svelte'
  import ExternalNode from '$lib/components/flow/ExternalNode.svelte'
  import {isDarkMode, logDiagramAction, showLegend} from '$lib/stores/diagram';
  import ServiceGroupNode from "$lib/components/flow/ServiceGroupNode.svelte";
  import SnakeEdge from "$lib/components/flow/SnakeEdge.svelte";

  const DOUBLE_CLICK_THRESHOLD = 400

  export let graph: FlowGraphInput | null = null
  export let pending = false

  const dispatch = createEventDispatcher<{
    nodeClick: string
    nodeDoubleClick: string
    goHome: void
  }>()

  const nodeTypes = { group: GroupNode, service: ServiceNode, external: ExternalNode, serviceGroup: ServiceGroupNode } as NodeTypes
  const edgeTypes = { snake: SnakeEdge } as EdgeTypes

  let nodes: Node[] = []
  let edges: Edge[] = []

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
    let lastLogAction = 0;
    logDiagramAction.subscribe((n) => {
      if (n !== lastLogAction) {
        lastLogAction = n;
        logDiagram();
      }
    });
  })

  $: targetSignature = graph?.signature ?? ''
  $: if (targetSignature !== currentSignature || (!graph && currentSignature !== '')) {
    runLayout(graph, targetSignature)
  }
  $: hasGraphData = !!graph && graph.serviceNodes.length > 0
  $: showOverlay = pending || layoutBusy || !graphReady
  $: console.debug('[FlowCanvas] overlay state', { showOverlay, pending, layoutBusy, graphReady })

  async function runLayout(sourceGraph: FlowGraphInput | null, signature: string) {
    layoutError = ''
    graphReady = false
    console.debug('[FlowCanvas] runLayout start', { hasGraph: !!sourceGraph, signature })
    if (!sourceGraph) {
      nodes = []
      edges = []
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
      nodes = result.nodes as Node[]
      edges = result.edges as Edge[]
      currentSignature = result.signature
      flowKey += 1
      graphReady = true
      console.debug('[FlowCanvas] runLayout complete', { nodeCount: result.nodes.length, edgeCount: result.edges.length })
    } catch (error) {
      layoutError = error instanceof Error ? error.message : 'Failed to lay out diagram.'
      console.error('[FlowCanvas] layout error', error)
      nodes = []
      edges = []
      graphReady = false
    } finally {
      layoutBusy = false
      console.debug('[FlowCanvas] runLayout finished', { graphReady, layoutBusy })
    }
  }

  //TODO: Fix me
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

  function logDiagram() {
    console.log('[FlowCanvas] Diagram log triggered', {
      nodes,
      edges,
      graph: graph
    });
  }
</script>

<div data-testid="flow-canvas" class="flex h-full flex-auto flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/20 shadow-xl">
    {#if hasGraphData}
      {#key flowKey}
        <SvelteFlow
          bind:nodes
          bind:edges
          {nodeTypes}
          {edgeTypes}
          nodesDraggable
          nodesConnectable={false}
          panOnDrag
          zoomOnScroll
          selectionOnDrag={false}
          colorMode={$isDarkMode ? 'dark' : 'light'}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >

          <!-- Todo: See if we can use tailwind here-->
          <Background bgColor={$isDarkMode ? '#1f2937' : '#e5e7eb'} variant={BackgroundVariant.Dots} gap={24} />
          <MiniMap nodeColor={(n) => {
            if (n.type === 'group') return '#2563eb'
            if (n.type === 'service') return '#16a34a'
            if (n.type === 'external') return '#d97706'
            return '#9ca3af'
          }} position="bottom-left" />
          <Controls position="top-left" />
          <Panel position="bottom-right">
            {#if $showLegend && !showOverlay}
              <Legend />
            {/if}
          </Panel>
        </SvelteFlow>
      {/key}

    {:else}
      <div class="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-300">
        <span class="text-3xl" aria-hidden="true">🌀</span>
        <span>{emptyStateLabel}</span>
      </div>
    {/if}

    {#if showOverlay}
      <div
        data-testid="flow-loading-overlay"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-gray-700 dark:bg-black/70 dark:text-gray-200 backdrop-blur"
      >
        Rendering diagram…
      </div>
    {/if}

  {#if layoutError}
    <div class="border-t border-red-200 bg-red-100 px-4 py-2 text-sm text-red-700 dark:text-red-200 dark:bg-red-500/20 dark:border-red-500/40">{layoutError}</div>
  {/if}
</div>
