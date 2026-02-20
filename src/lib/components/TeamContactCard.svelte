<script lang="ts">
    import type {Team} from '$lib/types'
    import Icon from '@iconify/svelte'
    import {getTeam} from "$lib/data/teams";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import GenericSidebarCard from "$lib/components/GenericSidebarCard.svelte";

    const {teamId} = $props<{ teamId: string }>();

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

    let team = $state<Team | null>(null);
    let isLoading = $state(false);

    $effect(() => {
        if (!teamId) {
            team = null
            return
        }
        isLoading = true
        getTeam(teamId)
            .then((data) => {
                team = data
            })
            .catch((error) => {
                console.error('Error loading team data:', error)
                team = null
            })
            .finally(() => {
                isLoading = false
            })
    })


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

{#if isLoading}
    <LoadingSpinner message="Loading team information..."/>
{/if}

{#if team}
    <GenericSidebarCard title="Team" subtitle={team.name} description={team.description}>
        <div class="mt-4">
            {#if team.reachability?.length}
                <ul class="text-sm space-y-2 text-gray-700 dark:text-gray-200">
                    {#each team.reachability as entry}
                        <li class="flex items-center justify-between rounded-sm border border-gray-300 dark:border-b-blue-900 bg-white dark:bg-slate-700 px-3 py-2">
                            <div class="flex items-center gap-2">
                                <Icon icon={getChannelIcon(entry.channel)}
                                      class="h-4 w-4 text-gray-400 dark:text-gray-300" aria-hidden="true"/>
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
    </GenericSidebarCard>
{/if}
