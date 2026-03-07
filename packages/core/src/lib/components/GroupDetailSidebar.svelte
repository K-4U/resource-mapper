<script lang="ts">
    import type {GroupInfo} from '$shared/types'
    import {TeamContactCard, GenericSidebarCard} from '$lib/components'
    import {graphSelection} from '$lib/state/graphSelection.svelte'

    const {groupMap, groups, placeholderMessage = 'Select a node to see details'} = $props<{
        groupMap: Record<string, string>;
        groups: Record<string, GroupInfo>;
        placeholderMessage?: string;
    }>()

    let selectedNodeId = $derived(graphSelection.selectedNodeIds[0] ?? null);

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
