<script lang="ts">
    import type {GroupInfo} from '$lib/types'
    import TeamContactCard from '$lib/components/TeamContactCard.svelte'
    import {useNodes} from '@xyflow/svelte';

    const {groupMap, groups, placeholderMessage} = $props<{
        groupMap: Record<string, string>;
        groups: Record<string, GroupInfo>;
        placeholderMessage: string;
    }>()

    // Derive selection directly from XYFlow state to avoid subscription loops
    const nodes = useNodes();
    let selectedNodeId = $derived(nodes.current.find(n => n.selected)?.id ?? null);

    let groupId = $derived(selectedNodeId ? (groupMap[selectedNodeId] ?? null) : null);
    let groupInfo = $derived(groupId ? (groups[groupId] ?? null) : null);
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
