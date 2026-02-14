<script lang="ts">
  import type { GroupInfo, Team } from '$lib/types'
  import TeamContactCard from '$lib/components/TeamContactCard.svelte'

  export let groupId: string | null = null
  export let groups: Record<string, GroupInfo> = {}
  export let teams: Record<string, Team> | null = null
  export let placeholderMessage = 'Select a group to see details.'

  $: groupInfo = groupId ? groups[groupId] ?? null : null
</script>

<aside data-testid="group-sidebar" class="flex h-full w-full flex-col border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100">
  <div class="flex-1 overflow-y-auto p-4">
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
          <TeamContactCard teamId={groupInfo.teamId} teams={teams ?? undefined} />
        </div>
      {/if}
    {/if}
  </div>
</aside>
