<script lang="ts">
    import TeamContactCard from '$lib/components/TeamContactCard.svelte'
    import {useNodes, useOnSelectionChange} from "@xyflow/svelte";
    import type {GroupInfo, ServiceDefinition} from "$lib/types";
    import {getAwsIconPath} from "$lib/utils/awsIcons";
    import GenericSidebarCard from "$lib/components/GenericSidebarCard.svelte";

    let selectedNodes = [];
    let selectedEdges = [];

    const nodes = useNodes().current;
    const selectedNode = nodes.find((node) => node.selected);

    useOnSelectionChange(({nodes, edges}) => {
        selectedNodes = nodes.map((node) => node.id);
        selectedEdges = edges.map((edge) => edge.id);
        if (selectedNodes.length > 0) {
            service = serviceNodeLookup[selectedNodes[0]] ?? null;
        } else {
            service = null;
        }
    });

    const {group, serviceNodeLookup} = $props<{
        group: GroupInfo | null;
        serviceNodeLookup: Record<string, ServiceDefinition>;
    }>();

    let service = $state<ServiceDefinition | null>(null)
    let iconPath = $state<string | null>(null)
    let initials = $state('');

    $effect(() => {
        if (selectedNode) {
            service = serviceNodeLookup[selectedNode.id] ?? null;
        }
    });

    $effect(() => {
        if (service) {
            iconPath = getAwsIconPath(service.serviceType)
            initials = service.friendlyName
                ? service.friendlyName
                    .split(' ')
                    .map(part => part[0])
                    .join('')
                    .slice(0, 3)
                    .toUpperCase()
                : 'Svc'
        }
    })

</script>

<aside class="flex h-full w-96 flex-col border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100">
    <div class="flex-1 overflow-y-auto p-4">
        {#if !group}
            <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700 p-4 text-sm text-gray-500 dark:text-gray-300">
                Select a group to view details.
            </div>
        {:else}
            <GenericSidebarCard title="Current Group" subtitle={group.name} description={group.description}/>
            {#if group.teamId}
                <TeamContactCard teamId={group.teamId}/>
            {/if}
            {#if service}
                <GenericSidebarCard title="Service" subtitle={service.friendlyName} description={service.description}
                                    iconPath={iconPath?? undefined} iconAlt={initials}/>
            {/if}
            <!--{#if isExternalService() && serviceGroup}
                <div class="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
                    <div class="text-xs uppercase tracking-wide text-amber-200">External Service</div>
                    <h3 class="text-lg font-semibold text-white">{serviceGroup.name}</h3>
                    {#if serviceGroup.description}
                        <p class="mt-2 text-sm text-amber-100">{serviceGroup.description}</p>
                    {/if}
                    <p class="mt-3 text-xs text-amber-200/80">ID: {serviceGroup.groupName}</p>
                    {#if serviceGroup.teamId}
                        <div class="mt-4">
                            <TeamContactCard teamId={serviceGroup.teamId} teams={teams ?? undefined}/>
                        </div>
                    {/if}
                </div>
            {/if}-->
        {/if}
    </div>
</aside>
