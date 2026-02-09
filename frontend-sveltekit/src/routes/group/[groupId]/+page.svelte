<script lang="ts">
  import type { PageData } from './$types'
  import type { GroupInfo, ServiceDefinition, ExternalGroupServices, Team } from '$lib/types'
  import FlowCanvas from '$lib/components/FlowCanvas.svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte'
  import ServiceDetailSidebar from '$lib/components/ServiceDetailSidebar.svelte'
  import { buildGroupServicesDiagram } from '$lib/utils/mermaid/groupServicesDiagram'
  import { getServiceNodeIdFromDefinition } from '$lib/utils/mermaid/diagramHelpers'
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
  let diagramDefinition = ''
  let loadError: string | null = null

  if (!group) {
    loadError = groupId ? `Unable to load group '${groupId}'.` : 'Missing group identifier.'
  }

  $: diagramDefinition = group ? buildGroupServicesDiagram(group, services, externalServices) : ''
  if (group) {
    console.debug('[group.svelte] built diagram', {
      group: group.groupName,
      services: services.length,
      externalEntries: externalServices.length
    })
  }

  $: serviceNodeLookup = services.reduce((acc, service) => {
    const key = getServiceNodeIdFromDefinition(service)
    acc[key] = service
    return acc
  }, {} as Record<string, ServiceDefinition>)
  console.debug('[group.svelte] serviceNodeLookup size', Object.keys(serviceNodeLookup).length)

  $: {
    externalServiceLookup = {}
    externalGroupNodeLookup = {}
    externalServices.forEach(entry => {
      entry.services.forEach(service => {
        externalServiceLookup[getServiceNodeIdFromDefinition(service)] = {
          service,
          group: entry.group
        }
      })
      externalGroupNodeLookup[`${entry.direction}_${entry.group.groupName}`] = entry.group.groupName
    })
    console.debug('[group.svelte] external lookups populated', {
      serviceNodes: Object.keys(externalServiceLookup).length,
      groupNodes: Object.keys(externalGroupNodeLookup).length
    })
  }

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
    const externalGroupId = externalServiceLookup[nodeId]?.group.groupName || externalGroupNodeLookup[nodeId]
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
{:else}
  <div class="flex h-full min-h-0 flex-1 flex-col gap-6 lg:flex-row">
    <div class="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/20 shadow-xl">
      <FlowCanvas
        diagram={diagramDefinition}
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
