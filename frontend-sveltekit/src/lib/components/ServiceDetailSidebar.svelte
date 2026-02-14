<script lang="ts">
  import type { GroupInfo, ServiceDefinition, Team } from '$lib/types'
  import TeamContactCard from '$lib/components/TeamContactCard.svelte'
  import { createEventDispatcher } from 'svelte'

  export let group: GroupInfo | null = null
  export let service: ServiceDefinition | null = null
  export let serviceGroup: GroupInfo | null = null
  export let teams: Record<string, Team> | null = null

  const dispatch = createEventDispatcher<{ clearSelection: void }>()

  const isExternalService = () => {
    if (!group || !service || !serviceGroup) {
      return false
    }
    return serviceGroup.groupName !== group.groupName
  }
</script>

<aside class="flex h-full w-96 flex-col border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100">
  <div class="flex-1 overflow-y-auto p-4">
    {#if !group}
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700 p-4 text-sm text-gray-500 dark:text-gray-300">
        Select a group to view details.
      </div>
    {:else}
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700 p-4">
        <div class="big-title">Current Group</div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{group.name}</h2>
        {#if group.description}
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{group.description}</p>
        {/if}
        <p class="mt-3 text-xs text-gray-500 dark:text-gray-300">ID: {group.groupName}</p>
        {#if group.teamId}
          <div class="mt-4">
            <TeamContactCard teamId={group.teamId} teams={teams ?? undefined} />
          </div>
        {/if}
      </div>

      <div class="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700 p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">Service</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {service ? service.friendlyName : 'Select a service'}
            </h3>
          </div>
          {#if service}
            <button
              class="rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
              on:click={() => dispatch('clearSelection')}
            >
              Clear
            </button>
          {/if}
        </div>
        {#if service}
          <div class="mt-3 text-sm text-gray-700 dark:text-gray-300">{service.description ?? 'No description provided.'}</div>
          <div class="mt-4 text-xs text-gray-500 dark:text-gray-300">ID: {service.identifier}</div>
          <div class="mt-2 inline-flex rounded-full border border-blue-500/40 px-3 py-1 text-xs text-blue-300">
            {service.serviceType}
          </div>
        {:else}
          <p class="mt-4 text-sm text-gray-500">Click a service node to inspect its details.</p>
        {/if}
      </div>

      {#if isExternalService() && serviceGroup}
        <div class="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
          <div class="text-xs uppercase tracking-wide text-amber-200">External Service</div>
          <h3 class="text-lg font-semibold text-white">{serviceGroup.name}</h3>
          {#if serviceGroup.description}
            <p class="mt-2 text-sm text-amber-100">{serviceGroup.description}</p>
          {/if}
          <p class="mt-3 text-xs text-amber-200/80">ID: {serviceGroup.groupName}</p>
          {#if serviceGroup.teamId}
            <div class="mt-4">
              <TeamContactCard teamId={serviceGroup.teamId} teams={teams ?? undefined} />
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</aside>
