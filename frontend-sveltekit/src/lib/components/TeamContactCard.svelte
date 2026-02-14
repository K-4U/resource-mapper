<script lang="ts">
  import type { Team } from '$lib/types'
  import Icon from '@iconify/svelte'

  export let teamId: string | null = null
  export let team: Team | null = null
  export let teams: Record<string, Team> | null = null

  const iconMap: Record<string, string> = {
    email: 'mailto:',
    phone: 'tel:',
    sms: 'sms:',
    web: '',
    slack: '',
    teams: '',
    pigeon: '',
    pagerduty: ''
  }

  const channelIcons: Record<string, string> = {
    email: 'mdi:email-outline',
    phone: 'mdi:phone-outline',
    sms: 'mdi:message-text-outline',
    web: 'mdi:web',
    slack: 'mdi:slack',
    teams: 'mdi:microsoft-teams',
    pigeon: 'mdi:owl',
    pagerduty: 'mdi:bell-ring-outline'
  }

  $: resolvedTeam = team ?? (teamId && teams ? teams[teamId] ?? null : null)
  $: reachOptions = resolvedTeam?.reachability ?? []

  const defaultChannelIcon = 'mdi:link-variant'

  function getChannelIcon(channel: string): string {
    return channelIcons[channel.toLowerCase()] ?? defaultChannelIcon
  }

  function formatChannel(channel: string) {
    return channel.replace(/[-_]/g, ' ').replace(/^\w|\s\w/g, (c) => c.toUpperCase())
  }

  function buildLink(channel: string, detail: string) {
    const prefix = iconMap[channel.toLowerCase()]
    if (prefix === undefined) {
      return null
    }
    if (!prefix) {
      return detail.startsWith('http') ? detail : detail.startsWith('//') ? detail : `https://${detail}`
    }
    return `${prefix}${detail}`
  }
</script>

{#if resolvedTeam}
  <div class="rounded-xl border border-gray-200 bg-gray-100 dark:bg-slate-800 p-4 text-gray-900 dark:text-gray-100">
    <div class="big-title">Team</div>
    <h3 class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{resolvedTeam.name}</h3>
    {#if resolvedTeam.description}
      <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{resolvedTeam.description}</p>
    {/if}

    <div class="mt-4">
      <div class="text-sm font-medium text-gray-700 dark:text-gray-300">How to reach them</div>
      {#if reachOptions.length}
        <ul class="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-200">
          {#each reachOptions as entry}
            <li class="flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-700 px-3 py-2">
              <div class="flex items-center gap-2">
                <Icon icon={getChannelIcon(entry.channel)} class="h-4 w-4 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                <span>{formatChannel(entry.channel)}</span>
              </div>
              {#if buildLink(entry.channel, entry.detail)}
                <a
                  href={buildLink(entry.channel, entry.detail)}
                  target={entry.channel === 'web' ? '_blank' : undefined}
                  rel="noreferrer"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  {entry.detail}
                </a>
              {:else}
                <span class="text-gray-500 dark:text-gray-400">{entry.detail}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">No contact methods provided yet.</p>
      {/if}
    </div>
  </div>
{/if}
