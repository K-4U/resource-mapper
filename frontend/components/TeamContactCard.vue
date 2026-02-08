<template>
  <v-card v-if="team" variant="outlined" class="ma-4">
    <v-card-title class="text-subtitle-1 d-flex align-center">
      <v-icon icon="mdi-shield-account" class="mr-2" color="primary" />
      Responsible Team
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div class="text-h6 mb-1">{{ team.name }}</div>
      <div v-if="team.description" class="text-body-2 text-medium-emphasis">
        {{ team.description }}
      </div>
    </v-card-text>
    <v-divider />
    <v-card-text>
      <div class="text-subtitle-2 mb-2">How to reach them</div>
      <v-list density="compact" variant="flat">
        <v-list-item v-if="team.teamLead">
          <template #prepend>
            <v-icon icon="mdi-account-tie" color="primary" class="mr-2" />
          </template>
          <v-list-item-title>Team Lead</v-list-item-title>
          <v-list-item-subtitle>{{ team.teamLead }}</v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-if="team.email">
          <template #prepend>
            <v-icon icon="mdi-email-outline" color="primary" class="mr-2" />
          </template>
          <v-list-item-title>Email</v-list-item-title>
          <v-list-item-subtitle>
            <a :href="`mailto:${team.email}`">{{ team.email }}</a>
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-if="team.slackChannel">
          <template #prepend>
            <v-icon icon="mdi-slack" color="primary" class="mr-2" />
          </template>
          <v-list-item-title>Slack</v-list-item-title>
          <v-list-item-subtitle>{{ team.slackChannel }}</v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-if="team.oncallPhone">
          <template #prepend>
            <v-icon icon="mdi-phone" color="primary" class="mr-2" />
          </template>
          <v-list-item-title>On-call</v-list-item-title>
          <v-list-item-subtitle>
            <a :href="`tel:${team.oncallPhone}`">{{ team.oncallPhone }}</a>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTeams } from '~/composables/useTeams'
import type { Team } from '~/types'

interface Props {
  teamId: string
}

const props = defineProps<Props>()
const { data: teamsData } = await useTeams()
const team = computed<Team | null>(() => teamsData.value?.[props.teamId] ?? null)
</script>

