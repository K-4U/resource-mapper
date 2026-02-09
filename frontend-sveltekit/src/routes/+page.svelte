<script lang="ts">
  import type { PageData } from './$types'
  import FlowCanvas from '$lib/components/FlowCanvas.svelte'
  import GroupDetailSidebar from '$lib/components/GroupDetailSidebar.svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
  import EmptyState from '$lib/components/EmptyState.svelte'
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte'
  import type { FlowGraphInput } from '$lib/utils/flow/types'
  import { buildGroupOverviewGraph } from '$lib/utils/flow/groupOverviewGraph'
  import { goto, invalidateAll } from '$app/navigation'

  export let data: PageData

  const groups = data.groups
  const teams = data.teams
  const groupConnections = data.groupConnections
  const errorMessage = data.errorMessage

  let selectedGroupId: string | null = null
  let graphInput: FlowGraphInput | null = null
  let nodeGroupMap: Record<string, string> = {}
  let isLoading = true
  let hasDiagramContent = false

  $: if (groups && groupConnections) {
    const { graph, nodeToGroupMap } = buildGroupOverviewGraph(groups, groupConnections)
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
    selectedGroupId = null
  }

  $: isLoading = !groups || !groupConnections
  $: hasDiagramContent = !!(graphInput && graphInput.nodes.length > 0)

  function handleNodeClick(event: CustomEvent<string>) {
    console.debug('[overview.svelte] nodeClick', event.detail)
    selectedGroupId = nodeGroupMap[event.detail] ?? null
  }

  function handleNodeDoubleClick(event: CustomEvent<string>) {
    const groupId = nodeGroupMap[event.detail]
    console.debug('[overview.svelte] nodeDoubleClick', { nodeId: event.detail, groupId })
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
  <LoadingSpinner message="Loading group overview..." />
{:else if !hasDiagramContent}
  <EmptyState title="No Groups Found" message="No group definitions were discovered in the static data set." />
{:else}
  <div class="flex h-full min-h-0 flex-1 flex-col gap-6 lg:flex-row">
    <div class="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/20 shadow-xl">
      <FlowCanvas
        graph={graphInput}
        pending={false}
        label="All Groups"
        on:nodeClick={handleNodeClick}
        on:nodeDoubleClick={handleNodeDoubleClick}
        on:goHome={() => {
          console.debug('[overview.svelte] goHome triggered')
          selectedGroupId = null
        }}
      />
    </div>
    <div class="flex h-full min-h-0 w-full lg:w-[420px] xl:w-[480px]">
      <GroupDetailSidebar
        groupId={selectedGroupId}
        groups={groups ?? {}}
        teams={teams ?? null}
        placeholderMessage="Select a group to see details"
      />
    </div>
  </div>
{/if}
