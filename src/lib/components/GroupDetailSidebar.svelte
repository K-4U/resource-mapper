<script lang="ts">
    import type {GroupInfo, Team} from '$lib/types'
    import TeamContactCard from '$lib/components/TeamContactCard.svelte'

    import {useOnSelectionChange} from '@xyflow/svelte';

    const {groupMap, groups, placeholderMessage} = $props<{
        groupMap: Record<string, string>;
        groups: Record<string, GroupInfo>;
        placeholderMessage: string;
    }>()
    
    let selectedNodes = $state<string[]>([]);
    let selectedEdges = $state<string[]>([]);
    let groupId: string | null = $state(null)

    useOnSelectionChange(({nodes, edges}) => {
        selectedNodes = nodes.map((node) => node.id);
        selectedEdges = edges.map((edge) => edge.id);
        if (selectedNodes.length > 0) {
            console.debug('[GroupDetailSidebar] selection changed', {selectedNodes, selectedEdges})
            groupId = groupMap[selectedNodes[0]] ?? null;
        } else {
            groupId = null;
        }
    });
    
    let groupInfo = $derived(groupId ? groups[groupId] ?? null : null)
</script>

<aside data-testid="group-sidebar"
       class="flex h-full flex-col basis-1/6 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 overflow-hidden rounded-2xl border shadow-xl p-3">
    {#if !groupInfo}
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700 p-4 text-sm text-gray-500 dark:text-gray-300">
            {placeholderMessage}
        </div>
    {:else}
        <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700 p-4 shadow">
            <p class="big-title">Group</p>
            <h2 class="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{groupInfo.name}</h2>
            {#if groupInfo.description}
                <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{groupInfo.description}</p>
            {/if}
            <dl class="mt-4 space-y-1 text-xs text-gray-500 dark:text-gray-300">
                <div>
                    <dt class="font-medium text-gray-700 dark:text-gray-300">Identifier</dt>
                    <dd>{groupInfo.groupName}</dd>
                </div>
            </dl>
        </div>

        {#if groupInfo.teamId}
            <div class="mt-4">
                <TeamContactCard teamId={groupInfo.teamId}/>
            </div>
        {/if}
    {/if}
</aside>
