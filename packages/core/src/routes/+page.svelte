<script lang="ts">
    import type {PageData} from './$types'
    import {FlowCanvas, GroupDetailSidebar, LoadingSpinner, EmptyState, ErrorDisplay, GraphProvider} from '$lib/components'
    import {buildGroupOverviewGraph} from '$lib/utils/flow/groupOverviewGraph'
    import {goto, invalidateAll} from '$app/navigation'

    let { data } = $props<{ data: PageData }>()

    const groups = $derived(data.groups)
    const groupConnections = $derived(data.groupConnections)
    const errorMessage = $derived(data.errorMessage)

    let { graphInput, nodeGroupMap } = $derived.by(() => {
        if (groups && groupConnections) {
            const {graph, nodeToGroupMap} = buildGroupOverviewGraph(groups, groupConnections)
            console.debug('[overview.svelte] built flow graph', {
                groups: Object.keys(groups).length,
                connections: groupConnections.length,
                nodeCount: Object.keys(nodeToGroupMap).length,
                hasGraph: !!graph
            })
            return { graphInput: graph, nodeGroupMap: nodeToGroupMap }
        }
        return { graphInput: null, nodeGroupMap: {} }
    })

    let isLoading = $derived(!groups || !groupConnections)
    let hasDiagramContent = $derived(true)

    function handleNodeDoubleClick(nodeId: string) {
        const groupId = nodeGroupMap[nodeId]
        console.debug('[overview.svelte] nodeDoubleClick', {nodeId, groupId})
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
      'Ensure YAML data exists under /data/services',
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
        <GraphProvider>
            <!-- Todo: make the pending variable dependant on the actual loading of data -->
            <FlowCanvas
                    graph={graphInput}
                    pending={isLoading}
                    onnodeDoubleClick={handleNodeDoubleClick}
            />
            <!-- Todo: Check if we can resize this sidebar on drag -->
            <!-- Todo: Check if we can close the sidebar with a button in the center left of the sidebar when open -->
            <GroupDetailSidebar
                    groupMap={nodeGroupMap}
                    groups={groups ?? {}}
                    placeholderMessage="Select a group to see details"
            />
        </GraphProvider>
    </div>
{/if}
