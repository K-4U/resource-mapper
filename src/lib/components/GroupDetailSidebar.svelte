<script lang="ts">
    import type {GroupInfo} from '$lib/types'
    import TeamContactCard from '$lib/components/TeamContactCard.svelte'
    import {useNodes} from '@xyflow/svelte';
    import GenericSidebarCard from "$lib/components/GenericSidebarCard.svelte";

    const {groupMap, groups} = $props<{
        groupMap: Record<string, string>;
        groups: Record<string, GroupInfo>;
    }>()

    const nodes = useNodes();
    let selectedNodeId = $derived(nodes.current.find(n => n.selected)?.id ?? null);

    let groupId = $derived(selectedNodeId ? (groupMap[selectedNodeId] ?? null) : null);
    let groupInfo = $derived(groupId ? (groups[groupId] ?? null) : null);
</script>

<aside data-testid="group-sidebar"
       class="flex h-full flex-col basis-1/6 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 overflow-hidden rounded-2xl border shadow-xl p-3">
    {#if !groupInfo}
        <GenericSidebarCard title="No Group Selected" description="Select a group to view details." />
    {:else}
        <GenericSidebarCard title="Group" subtitle={groupInfo.name} description={groupInfo.description}/>

        {#if groupInfo.teamId}
            <div class="mt-4">
                <TeamContactCard teamId={groupInfo.teamId}/>
            </div>
        {/if}
    {/if}
</aside>
