<script lang="ts">
    import type {Team} from '$shared/types'
    import Icon from '@iconify/svelte'
    import {getTeam} from "$lib/data/teams";
    import {LoadingSpinner, GenericSidebarCard} from "$lib/components";
    import { slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    const {teamId, classes} = $props<{ teamId: string, classes?: string }>();

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

    let activeChannel = $state<string | null>(null);
    let copied = $state(false);

    function toggleChannel(channelId: string) {
        activeChannel = activeChannel === channelId ? null : channelId;
        copied = false; // Reset feedback when switching
    }

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            copied = true;
            setTimeout(() => (copied = false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }
</script>

{#if isLoading}
    <LoadingSpinner message="Loading team information..."/>
{/if}

{#if team}
    <GenericSidebarCard title="Team" subtitle={team.name} description={team.description} classes={classes}>
        <div class="mt-4 w-full">
            {#if team.reachability?.length}
                <div class="flex flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/50">

                    <div class="flex items-center divide-x divide-gray-200 dark:divide-slate-700">
                        {#each team.reachability as entry}
                            {@const isExpanded = activeChannel === entry.channel}
                            <button
                                    onclick={() => toggleChannel(entry.channel)}
                                    class="flex h-12 flex-1 items-center justify-center transition-all
                               {isExpanded ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700/50'}"
                            >
                                <Icon icon={getChannelIcon(entry.channel)} class="h-5 w-5" />
                            </button>
                        {/each}
                    </div>

                    {#each team.reachability as entry}
                        {#if activeChannel === entry.channel}
                            <div
                                    transition:slide={{ duration: 300, easing: quintOut }}
                                    class="relative border-t border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/30"
                            >
                                <button
                                        onclick={() => copyToClipboard(entry.detail)}
                                        class="absolute right-2 top-2 rounded-md p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-slate-700"
                                        aria-label="Copy to clipboard"
                                >
                                    {#if copied}
                                        <Icon icon="mdi:check-bold" class="h-4 w-4 text-green-500" />
                                    {:else}
                                        <Icon icon="mdi:content-copy" class="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300" />
                                    {/if}
                                </button>

                                <div class="flex flex-col gap-1 pr-8">
                            <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                {formatChannel(entry.channel)}
                            </span>

                                    {#if buildLink(entry.channel, entry.detail)}
                                        <a
                                                href={buildLink(entry.channel, entry.detail)}
                                                target={entry.channel === 'web' ? '_blank' : undefined}
                                                rel="noreferrer"
                                                class="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400 break-all"
                                        >
                                            {entry.detail}
                                        </a>
                                    {:else}
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-200 leading-relaxed">
                                    {entry.detail}
                                </span>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            {:else}
                <p class="text-sm italic text-gray-500 dark:text-gray-400">No contact methods provided.</p>
            {/if}
        </div>
    </GenericSidebarCard>
{/if}
