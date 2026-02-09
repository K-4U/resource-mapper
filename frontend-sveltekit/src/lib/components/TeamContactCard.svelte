<script lang="ts">
  import type { Team } from '$lib/types'
  import {
    Mail,
    Phone,
    MessageSquare,
    Globe,
    Slack,
    Users,
    Bird,
    BellRing,
    Link
  } from 'lucide-svelte'

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

  type IconComponent = typeof Mail

  const channelIcons: Record<string, IconComponent> = {
    email: Mail,
    phone: Phone,
    sms: MessageSquare,
    web: Globe,
    slack: Slack,
    teams: Users,
    pigeon: Bird,
    pagerduty: BellRing
  }

  $: resolvedTeam = team ?? (teamId && teams ? teams[teamId] ?? null : null)
  $: reachOptions = resolvedTeam?.reachability ?? []

  const defaultChannelIcon: IconComponent = Link

  function getChannelIcon(channel: string): IconComponent {
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
  <div class="rounded-xl border border-gray-200 bg-white/5 p-4">
    <div class="text-sm font-semibold text-gray-300">Responsible Team</div>
    <h3 class="text-lg font-semibold text-white">{resolvedTeam.name}</h3>
    {#if resolvedTeam.description}
      <p class="mt-1 text-sm text-gray-400">{resolvedTeam.description}</p>
    {/if}
    {#if resolvedTeam.teamLead}
      <p class="mt-2 text-xs text-gray-500">Led by {resolvedTeam.teamLead}</p>
    {/if}

    <div class="mt-4">
      <div class="text-sm font-medium text-gray-300">How to reach them</div>
      {#if reachOptions.length}
        <ul class="mt-2 space-y-2 text-sm text-gray-200">
          {#each reachOptions as entry}
            <li class="flex items-center justify-between rounded-lg border border-gray-700/40 px-3 py-2">
              <div class="flex items-center gap-2">
                <svelte:component this={getChannelIcon(entry.channel)} class="h-4 w-4 text-gray-400" aria-hidden="true" />
                <span>{formatChannel(entry.channel)}</span>
              </div>
              {#if buildLink(entry.channel, entry.detail)}
                <a
                  href={buildLink(entry.channel, entry.detail)}
                  target={entry.channel === 'web' ? '_blank' : undefined}
                  rel="noreferrer"
                  class="text-blue-400 hover:text-blue-300"
                >
                  {entry.detail}
                </a>
              {:else}
                <span class="text-gray-400">{entry.detail}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-2 text-sm text-gray-500">No contact methods provided yet.</p>
      {/if}
    </div>
  </div>
{/if}
