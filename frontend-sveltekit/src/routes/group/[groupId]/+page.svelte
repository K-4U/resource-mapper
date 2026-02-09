<script lang="ts">
  import type { PageData } from './$types'
  import type { GroupInfo, ServiceDefinition, ExternalGroupServices, Team } from '$lib/types'
  import FlowCanvas from '$lib/components/FlowCanvas.svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte'
  import EmptyState from '$lib/components/EmptyState.svelte'
  import ServiceDetailSidebar from '$lib/components/ServiceDetailSidebar.svelte'
  import type { FlowGraphInput } from '$lib/utils/flow/types'
  import { buildGroupServicesGraph } from '$lib/utils/flow/groupServicesGraph'
  import { goto } from '$app/navigation'

  export let data: PageData

  const group = data.group
  const services: ServiceDefinition[] = data.services ?? []
  const externalServices: ExternalGroupServices[] = data.externalServices ?? []
  const teams: Record<string, Team> | null = data.teams ?? null
  const groupId = data.groupId

  let selectedServiceId: string | null = null
  let selectedExternalService: { service: ServiceDefinition; group: GroupInfo } | null = null
  let serviceNodeLookup: Record<string, ServiceDefinition> = {}
  let externalServiceLookup: Record<string, { service: ServiceDefinition; group: GroupInfo }> = {}
  let externalGroupNodeLookup: Record<string, string> = {}
  let groupGraph: FlowGraphInput | null = null
  let loadError: string | null = null
  let hasDiagramContent = false

  if (!group) {
    loadError = groupId ? `Unable to load group '${groupId}'.` : 'Missing group identifier.'
  }

  $: if (group) {
    const result = buildGroupServicesGraph(group, services, externalServices)
    groupGraph = result.graph
    serviceNodeLookup = result.serviceNodes
    externalServiceLookup = result.externalNodes
    externalGroupNodeLookup = Object.entries(result.externalNodes).reduce<Record<string, string>>((acc, [nodeId, entry]) => {
      acc[nodeId] = entry.group.groupName
      return acc
    }, {})
    console.debug('[group.svelte] built flow graph', {
      group: group.groupName,
      services: services.length,
      externalEntries: externalServices.length,
      nodeCount: groupGraph.nodes.length
    })
  } else {
    groupGraph = null
    serviceNodeLookup = {}
    externalServiceLookup = {}
    externalGroupNodeLookup = {}
  }

  $: hasDiagramContent = !!(groupGraph && groupGraph.nodes.length > 0)

  function handleNodeClick(event: CustomEvent<string>) {
    const nodeId = event.detail
    console.debug('[group.svelte] nodeClick', nodeId)
    if (serviceNodeLookup[nodeId]) {
      selectedServiceId = nodeId
      selectedExternalService = null
      return
    }
    const external = externalServiceLookup[nodeId]
    if (external) {
      selectedServiceId = null
      selectedExternalService = external
      return
    }
    selectedServiceId = null
    selectedExternalService = null
  }

  function handleNodeDoubleClick(event: CustomEvent<string>) {
    const nodeId = event.detail
    const externalGroupId = externalGroupNodeLookup[nodeId]
    console.debug('[group.svelte] nodeDoubleClick', { nodeId, externalGroupId })
    if (externalGroupId) {
      goto(`/group/${externalGroupId}`)
    }
  }
</script>

<svelte:head>
  <title>Resource Mapper – {group?.name ?? 'Group'}</title>
</svelte:head>

{#if loadError}
  <ErrorDisplay
    title="Unable to load group"
    message={loadError}
    checkList={['Verify the group identifier in the URL', 'Ensure the YAML definition exists']}
    onBack={() => goto('/')}
  />
{:else if !group}
  <LoadingSpinner message="Loading group..." />
{:else if !hasDiagramContent}
  <EmptyState title="No services" message="This group has no service diagram to display yet." />
{:else}
  <div class="flex h-full min-h-0 flex-1 flex-col gap-6 lg:flex-row">
    <div class="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/20 shadow-xl">
      <FlowCanvas
        graph={groupGraph}
        pending={false}
        label={group.name}
        on:nodeClick={handleNodeClick}
        on:nodeDoubleClick={handleNodeDoubleClick}
        on:goHome={() => {
          console.debug('[group.svelte] goHome triggered')
          goto('/')
        }}
      />
    </div>
    <div class="flex h-full min-h-0 w-full lg:w-[420px] xl:w-[480px]">
      <ServiceDetailSidebar
        {group}
        service={selectedServiceId ? serviceNodeLookup[selectedServiceId] ?? null : selectedExternalService?.service ?? null}
        serviceGroup={selectedServiceId ? group : selectedExternalService?.group ?? null}
        teams={teams}
        on:clearSelection={() => {
          console.debug('[group.svelte] clearSelection triggered')
          selectedServiceId = null
          selectedExternalService = null
        }}
      />
    </div>
  </div>
{/if}
