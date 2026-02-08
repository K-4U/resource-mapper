<template>
  <v-card
    v-if="hasTeamSource"
    :variant="flat ? 'text' : 'outlined'"
    :class="flat ? '' : 'ma-4'"
  >
    <v-card-title class="text-subtitle-1 d-flex align-center">
      <v-icon icon="mdi-shield-account" class="mr-2" color="primary" />
      Responsible Team
    </v-card-title>
    <v-divider />
    <template v-if="resolvedTeam">
      <v-card-text>
        <div class="text-h6 mb-1">{{ resolvedTeam.name }}</div>
        <div v-if="resolvedTeam.description" class="text-body-2 text-medium-emphasis">
          {{ resolvedTeam.description }}
        </div>
        <div v-if="resolvedTeam.teamLead" class="text-caption text-medium-emphasis mt-2">
          Led by {{ resolvedTeam.teamLead }}
        </div>
      </v-card-text>
      <v-divider />
      <v-card-text>
        <div class="text-subtitle-2 mb-2">How to reach them</div>
        <template v-if="reachOptions.length">
          <v-list density="compact" variant="flat">
            <v-list-item
              v-for="(entry, index) in reachOptions"
              :key="`${entry.channel}-${index}-${entry.detail}`"
            >
              <template #prepend>
                <v-icon :icon="resolveIcon(entry.channel)" color="primary" class="mr-2" />
              </template>
              <v-list-item-title>{{ formatChannel(entry.channel) }}</v-list-item-title>
              <v-list-item-subtitle>
                <a v-if="isLink(entry.channel)" :href="buildLink(entry.channel, entry.detail)">
                  {{ entry.detail }}
                </a>
                <span v-else>{{ entry.detail }}</span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </template>
        <v-alert
          v-else
          type="info"
          variant="tonal"
          density="compact"
        >
          No contact methods provided yet.
        </v-alert>
      </v-card-text>
    </template>
    <template v-else>
      <v-card-text>
        <v-skeleton-loader type="text@3" class="mb-2" />
        <v-skeleton-loader type="text@2" width="60%" />
      </v-card-text>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTeams } from '~/composables/useTeams'
import type { Team, TeamReachOption } from '~/types'

interface Props {
  teamId?: string | null
  team?: Team | null
  flat?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  flat: false,
  team: null,
  teamId: null
})
const { data: teamsData } = await useTeams()
const resolvedTeam = computed<Team | null>(() => props.team ?? (props.teamId ? teamsData.value?.[props.teamId] ?? null : null))
const hasTeamSource = computed(() => !!props.team || !!props.teamId)
const reachOptions = computed<TeamReachOption[]>(() => resolvedTeam.value?.reachability ?? [])

const iconMap: Record<string, string> = {
  email: 'mdi-email-outline',
  slack: 'mdi-slack',
  phone: 'mdi-phone',
  teams: 'mdi-microsoft-teams',
  pigeon: 'mdi-bird',
  sms: 'mdi-message-processing',
  web: 'mdi-earth',
  pagerduty: 'mdi-bell-alert'
}

const linkTypes = new Set(['email', 'phone', 'sms', 'web'])

function resolveIcon(channel: string) {
  return iconMap[channel.toLowerCase()] ?? 'mdi-link-variant'
}

function formatChannel(channel: string) {
  return channel.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function isLink(channel: string) {
  return linkTypes.has(channel.toLowerCase())
}

function buildLink(channel: string, detail: string) {
  const normalized = channel.toLowerCase()
  if (normalized === 'email') {
    return `mailto:${detail}`
  }
  if (normalized === 'phone' || normalized === 'sms') {
    return `tel:${detail}`
  }
  if (normalized === 'web') {
    return detail.startsWith('http') ? detail : `https://${detail}`
  }
  return detail
}
</script>
