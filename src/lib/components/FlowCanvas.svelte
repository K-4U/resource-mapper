<script lang="ts">
    import {onMount} from 'svelte'
    import {
        Background,
        BackgroundVariant,
        Controls,
        ControlButton,
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
    import type {FlowGraphInput, FlowNodeData} from '$lib/utils/flow/types'
    import MainGroupNode from '$lib/components/flow/MainGroupNode.svelte'
    import ServiceNode from '$lib/components/flow/ServiceNode.svelte'
    import ExternalNode from '$lib/components/flow/ExternalNode.svelte'
    import {isDarkMode, logDiagramAction, showLegend} from '$lib/stores/diagram';
    import ServiceGroupNode from "$lib/components/flow/ServiceGroupNode.svelte";
    import SnakeEdge from "$lib/components/flow/SnakeEdge.svelte";
    import Icon from "@iconify/svelte";
    import {goto} from "$app/navigation";

    const DOUBLE_CLICK_THRESHOLD = 400

    // Svelte 5 Props
    let {
        graph = null,
        pending = false,
        onnodeDoubleClick
    } = $props<{
        graph?: FlowGraphInput | null;
        pending?: boolean;
        onnodeDoubleClick?: (nodeId: string) => void;
    }>();


    const nodeTypes = {
        mainGroup: MainGroupNode,
        service: ServiceNode,
        external: ExternalNode,
        serviceGroup: ServiceGroupNode
    } as NodeTypes
    const edgeTypes = {snake: SnakeEdge} as EdgeTypes

    // Svelte 5 State
    let nodes: Node[] = $state([])
    let edges: Edge[] = $state([])

    let emptyStateLabel = $state('No diagram available.')
    let lastClickedNode: string | null = $state(null)
    let lastClickTimestamp = $state(0)
    let layoutError = $state('')
    let layoutBusy = $state(false)
    let graphReady = $state(false)
    let currentSignature = $state('')

    // Svelte 5 Derived
    let hasGraphData = $derived(!!graph && graph.serviceNodes.length > 0)
    let showOverlay = $derived(pending || layoutBusy || !graphReady)

    // TODO: This console.debug might be better as an effect or just removed if not needed for production
    $effect(() => {
        console.debug('[FlowCanvas] overlay state', {showOverlay, pending, layoutBusy, graphReady})
    })

    onMount(() => {
        let lastLogAction = 0;
        // TODO: Consider converting logDiagramAction store to a rune-based state if possible, or use $effect
        const unsubscribe = logDiagramAction.subscribe((n) => {
            if (n !== lastLogAction) {
                lastLogAction = n;
                logDiagram();
            }
        });
        return unsubscribe;
    })

    // 3. Fix the Reactive Trigger
    // Ensure this ONLY triggers when the parent passes a brand new graph
    $effect(() => {
        const newTargetSignature = graph?.signature ?? '';
        if (newTargetSignature !== '' && newTargetSignature !== currentSignature) {
            runLayout(graph, newTargetSignature);
        }
    });

    async function runLayout(sourceGraph: FlowGraphInput | null, signature: string) {
        layoutError = ''

        graphReady = false

        console.debug('[FlowCanvas] runLayout start', {hasGraph: !!sourceGraph, signature})
        if (!sourceGraph) {
            nodes = []
            edges = []
            emptyStateLabel = pending ? 'Rendering diagram…' : 'No diagram available.'
            currentSignature = signature
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

            currentSignature = result.signature;

            graphReady = true
            console.debug('[FlowCanvas] runLayout complete', {
                nodeCount: result.nodes.length,
                edgeCount: result.edges.length
            })
        } catch (error) {
            layoutError = error instanceof Error ? error.message : 'Failed to lay out diagram.'
            console.error('[FlowCanvas] layout error', error)
            nodes = []
            edges = []
            graphReady = false
        } finally {
            layoutBusy = false
            console.debug('[FlowCanvas] runLayout finished', {graphReady, layoutBusy})
        }
    }

    //TODO: This handleFlowNodeClick function seems to be unused in the template. If it's intended for Node components, consider passing it down.
    function handleFlowNodeClick(event: CustomEvent<{ node?: { id?: string } }>) {
        const nodeId = event.detail?.node?.id
        if (!nodeId) return
        const now = Date.now()
        if (lastClickedNode === nodeId && now - lastClickTimestamp <= DOUBLE_CLICK_THRESHOLD) {
            onnodeDoubleClick?.(nodeId)
            lastClickedNode = null
            lastClickTimestamp = 0
            return
        }
        lastClickedNode = nodeId
        lastClickTimestamp = now
    }

    // TODO: logDiagram is only called from logDiagramAction subscription, verify if this is actually needed.
    function logDiagram() {
        console.log('[FlowCanvas] Diagram log triggered', {
            nodes,
            edges,
            graph: graph
        });
    }

    function goHome() {
        goto('/');
    }

</script>

<div data-testid="flow-canvas"
     class="flex h-full flex-auto flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/20 shadow-xl">
    {#if hasGraphData}

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
            <Background bgColor={$isDarkMode ? '#1f2937' : '#e5e7eb'} variant={BackgroundVariant.Dots} gap={24}/>
            <MiniMap nodeColor={(n) => {
            if (n.type === 'group') return '#2563eb'
            if (n.type === 'service') return '#16a34a'
            if (n.type === 'external') return '#d97706'
            return '#9ca3af'
          }} position="bottom-left"/>
            <Controls position="top-left">
                <!-- Go home button -->
                <ControlButton onclick={goHome} title="Go Home" aria-label="Go to home page">
                    <Icon icon="mdi:home"/>
                </ControlButton>
            </Controls>
            <Panel position="bottom-right">
                {#if $showLegend && !showOverlay}
                    <Legend/>
                {/if}
            </Panel>
        </SvelteFlow>


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
