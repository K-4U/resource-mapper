<script lang="ts">
    import type {PageData} from './$types'
    import type {ExternalGroupServices, GroupInfo, ServiceDefinition} from '$shared/types'
    import {FlowCanvas, LoadingOverlay, ErrorDisplay, EmptyState, ServiceDetailSidebar} from '$lib/components';
    import type {FlowGraphInput} from '$shared/flow-types'
    import {buildGroupServicesGraph} from '$lib/utils/flow/servicesGraph'
    import {goto} from '$app/navigation'
    import {SvelteFlowProvider} from '@xyflow/svelte';
    import {selectedGroup} from "$lib/stores/diagram";

    let {data}: { data: PageData } = $props()

    let group = $derived(data.group)
    let allGroups = $derived(data.groups)
    let groupConnections = $derived(data.connections)
    let services: ServiceDefinition[] = $derived(data.services ?? [])
    let externalServices: ExternalGroupServices[] = $derived(data.externalServices ?? [])
    let groupId = $derived(data.groupId)

    let serviceNodeLookup = $state<Record<string, ServiceDefinition>>({})
    let externalServiceLookup = $state<Record<string, { service: ServiceDefinition; group: GroupInfo }>>({})
    let externalGroupNodeLookup = $state<Record<string, string>>({})
    let groupGraph = $state<FlowGraphInput | null>(null)
    let loadError = $state<string | null>(null)
    let hasDiagramContent = $derived(!!(groupGraph && groupGraph.serviceNodes.length > 0))


    $effect(() => {
        if (!group) {
            loadError = groupId ? `Unable to load group '${groupId}'.` : 'Missing group identifier.'
        } else {
            loadError = null
            selectedGroup.set(data.group)
        }
    })

    $effect(() => {
        if (group) {
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
    })

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
    <LoadingOverlay message="Loading group..."/>
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
                    {externalServiceLookup}
            />
        </SvelteFlowProvider>
    </div>
{/if}
