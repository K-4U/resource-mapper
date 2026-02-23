<script lang="ts">
    import TeamContactCard from '$lib/components/TeamContactCard.svelte'
    import {useNodes, useOnSelectionChange} from "@xyflow/svelte";
    import type {GroupInfo, ServiceDefinition} from "$lib/types";
    import {getAwsIconPath} from "$lib/utils/awsIcons";
    import GenericSidebarCard from "$lib/components/GenericSidebarCard.svelte";
    import {selectedGroup} from "$lib/stores/diagram";
    import {getGroup} from "$lib/data/groups";

    let selectedNodes = [];
    let selectedEdges = [];

    const nodes = useNodes();
    let selectedNode = $derived(nodes.current.find((node) => node.selected));

    useOnSelectionChange(({nodes: n, edges}) => {
        selectedNodes = n.map((node) => node.id);
        selectedEdges = edges.map((edge) => edge.id);
    });

    const {group, serviceNodeLookup, externalServiceLookup} = $props<{
        group: GroupInfo | null;
        serviceNodeLookup: Record<string, ServiceDefinition>;
        externalServiceLookup: Record<string, { service: ServiceDefinition; group: GroupInfo }>;
    }>();

    let isExternal = $derived(!!selectedNode && selectedNode.id in externalServiceLookup);

    let serviceInfo = $derived.by<ServiceDefinition | null>(() => {
        if (!selectedNode) return null;

        // Use the boolean to pick the source
        return isExternal
            ? externalServiceLookup[selectedNode.id]?.service
            : serviceNodeLookup[selectedNode.id];
    });

    let activeGroup = $state<GroupInfo | null>(group);

    $effect(() => {
        // If it's external and we have a groupId, go fetch it
        if (isExternal && serviceInfo?.groupId) {
            getGroup(serviceInfo.groupId).then(res => {
                activeGroup = res;
            });
        } else {
            // Otherwise, reset back to the group passed in via props
            activeGroup = group;
        }
    });

    let displayGroup = $derived(activeGroup);
    let displayTeamId = $derived(displayGroup?.teamId);

    let iconPath = $derived(serviceInfo ? getAwsIconPath(serviceInfo.serviceType) : null);
    let initials = $derived(
        serviceInfo?.friendlyName
            ? serviceInfo.friendlyName.split(' ').map(n => n[0]).join('').slice(0,3).toUpperCase()
            : 'Svc'
    );
</script>

<aside class="flex h-full w-96 flex-col border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100">
    <div class="flex-1 overflow-y-auto p-4 space-y-4">

        {#if !displayGroup}
            <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700 p-4 text-sm text-gray-500 dark:text-gray-300">
                Select a group to view details.
            </div>
        {:else}
            <GenericSidebarCard
                    title={isExternal ? "Group" : "Current Group"}
                    subtitle={displayGroup.name}
                    description={displayGroup.description}
                    classes={isExternal ? "external" : ""}
            />

            {#if displayTeamId}
                <TeamContactCard teamId={displayTeamId} classes={isExternal ? "external" : ""} />
            {/if}

            {#if serviceInfo}
                <GenericSidebarCard
                        title="Service"
                        subtitle={serviceInfo.friendlyName}
                        description={serviceInfo.description}
                        iconPath={iconPath ?? undefined}
                        iconAlt={initials}
                        classes={isExternal ? "external" : ""}
                />
            {/if}
        {/if}
    </div>
</aside>