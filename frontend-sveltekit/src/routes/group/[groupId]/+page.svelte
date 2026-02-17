<script lang="ts">
    import type {PageData} from './$types'
    import type {GroupInfo, ServiceDefinition, ExternalGroupServices, Team} from '$lib/types'
    import FlowCanvas from '$lib/components/FlowCanvas.svelte'
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
    import ErrorDisplay from '$lib/components/ErrorDisplay.svelte'
    import EmptyState from '$lib/components/EmptyState.svelte'
    import ServiceDetailSidebar from '$lib/components/ServiceDetailSidebar.svelte'
    import type {FlowGraphInput} from '$lib/utils/flow/types'
    import {buildGroupServicesGraph} from '$lib/utils/flow/groupServicesGraph'
    import {goto} from '$app/navigation'
    import {SvelteFlowProvider} from '@xyflow/svelte';

    export let data: PageData

    const group = data.group
    const allGroups = data.groups
    const groupConnections = data.connections
    const services: ServiceDefinition[] = data.services ?? []
    const externalServices: ExternalGroupServices[] = data.externalServices ?? []
    const groupId = data.groupId

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
        const result = buildGroupServicesGraph(group, services, allGroups, groupConnections, externalServices)
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
        })
    } else {
        groupGraph = null
        serviceNodeLookup = {}
        externalServiceLookup = {}
        externalGroupNodeLookup = {}
    }

    $: hasDiagramContent = !!(groupGraph && groupGraph.serviceNodes.length > 0)

    function handleNodeDoubleClick(event: CustomEvent<string>) {
        const nodeId = event.detail
        const externalGroupId = externalGroupNodeLookup[nodeId]
        console.debug('[group.svelte] nodeDoubleClick', {nodeId, externalGroupId})
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
    <LoadingSpinner message="Loading group..."/>
{:else if !hasDiagramContent}
    <EmptyState title="No services" message="This group has no service diagram to display yet."/>
{:else}
    <div class="flex h-full w-full gap-1 lg:flex-row">
        <SvelteFlowProvider>
            <FlowCanvas
                    graph={groupGraph}
                    pending={false}
                    on:nodeDoubleClick={handleNodeDoubleClick}
            />
<!--            on:nodeClick={handleNodeClick}-->

            <ServiceDetailSidebar
                    {group}
                    {serviceNodeLookup}
            />
        </SvelteFlowProvider>
    </div>
{/if}
