<script lang="ts">
  import type { GroupInfo, Team } from '$lib/types'
  import TeamContactCard from '$lib/components/TeamContactCard.svelte'

  export let groupId: string | null = null
  export let groups: Record<string, GroupInfo> = {}
  export let teams: Record<string, Team> | null = null
  export let placeholderMessage = 'Select a group to see details.'

  $: groupInfo = groupId ? groups[groupId] ?? null : null
</script>

<aside data-testid="group-sidebar" class="flex h-full w-full flex-col border-l border-gray-900/70 bg-gray-950/70">
  <div class="flex-1 overflow-y-auto p-4">
    {#if !groupInfo}
      <div class="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-gray-400">
        {placeholderMessage}
      </div>
    {:else}
      <div class="rounded-2xl border border-white/5 bg-black/30 p-4 shadow">
        <p class="text-xs uppercase tracking-[0.3em] text-blue-300">Group</p>
        <h2 class="mt-2 text-xl font-semibold text-white">{groupInfo.name}</h2>
        {#if groupInfo.description}
          <p class="mt-2 text-sm text-gray-300">{groupInfo.description}</p>
        {/if}
        <dl class="mt-4 space-y-1 text-xs text-gray-400">
          <div>
            <dt class="font-medium text-gray-300">Identifier</dt>
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
