<script lang="ts">
    import type {PageData} from './$types'
    import FlowCanvas from '$lib/components/FlowCanvas.svelte'
    import GroupDetailSidebar from '$lib/components/GroupDetailSidebar.svelte'
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
    import EmptyState from '$lib/components/EmptyState.svelte'
    import ErrorDisplay from '$lib/components/ErrorDisplay.svelte'
    import type {FlowGraphInput} from '$lib/utils/flow/types'
    import {buildGroupOverviewGraph} from '$lib/utils/flow/groupOverviewGraph'
    import {goto, invalidateAll} from '$app/navigation'
    import {SvelteFlowProvider} from "@xyflow/svelte";

    export let data: PageData

    const groups = data.groups
    const teams = data.teams
    const groupConnections = data.groupConnections
    const errorMessage = data.errorMessage

    let graphInput: FlowGraphInput | null = null
    let nodeGroupMap: Record<string, string> = {}
    let isLoading = true
    let hasDiagramContent = false

    $: if (groups && groupConnections) {
        const {graph, nodeToGroupMap} = buildGroupOverviewGraph(groups, groupConnections)
        console.debug('[overview.svelte] built flow graph', {
            groups: Object.keys(groups).length,
            connections: groupConnections.length,
            nodeCount: Object.keys(nodeToGroupMap).length,
            hasGraph: !!graph
        })
        graphInput = graph
        nodeGroupMap = nodeToGroupMap
    } else {
        graphInput = null
        nodeGroupMap = {}
    }

    $: isLoading = !groups || !groupConnections
    $: hasDiagramContent = true

    function handleNodeDoubleClick(event: CustomEvent<string>) {
        const groupId = nodeGroupMap[event.detail]
        console.debug('[overview.svelte] nodeDoubleClick', {nodeId: event.detail, groupId})
        if (groupId) {
            goto(`/group/${groupId}`)
        }
    }

    async function refreshData() {
        await invalidateAll()
    }
</script>

<svelte:head>
    <title>Resource Mapper – Overview</title>
</svelte:head>

{#if errorMessage}
    <ErrorDisplay
            title="Error loading groups"
            message="Failed to load the group overview diagram."
            checkList={[
      'Ensure YAML data exists under src/lib/data/services',
      'Check the browser console for more details'
    ]}
            technicalDetails={errorMessage}
            onRetry={refreshData}
    />
{:else if isLoading}
    <LoadingSpinner message="Loading group overview..."/>
{:else if !hasDiagramContent}
    <EmptyState title="No Groups Found" message="No group definitions were discovered in the static data set."/>
{:else}
    <div class="flex h-full w-full gap-1 lg:flex-row">
        <SvelteFlowProvider>
            <!-- Todo: make the pending variable dependant on the actual loading of data -->
            <FlowCanvas
                    graph={graphInput}
                    pending={isLoading}
                    on:nodeDoubleClick={handleNodeDoubleClick}
            />
            <!-- Todo: Check if we can resize this sidebar on drag -->
            <!-- Todo: Check if we can close the sidebar with a button in the center left of the sidebar when open -->
            <GroupDetailSidebar
                    groupMap={nodeGroupMap}
                    groups={groups ?? {}}
                    teams={teams ?? null}
                    placeholderMessage="Select a group to see details"
            />
        </SvelteFlowProvider>
    </div>
{/if}
