<template>
  <aside class="sidebar">
    <v-sheet class="d-flex flex-column fill-height" elevation="0">
      <v-toolbar color="primary" density="comfortable" dark>
        <v-toolbar-title class="text-subtitle-1">Details</v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" density="comfortable" @click="$emit('clear-selection')" />
      </v-toolbar>

      <v-card variant="outlined" class="ma-4">
        <v-card-text>
          <div class="text-h6 mb-2">{{ groupTitle }}</div>
          <div v-if="groupInfo?.description" class="text-body-2 text-medium-emphasis">
            {{ groupInfo.description }}
          </div>
          <div v-else-if="serviceId" class="text-body-2 text-medium-emphasis">
            Service: {{ serviceId }}
          </div>
        </v-card-text>
        <v-divider />
        <v-list density="compact">
          <v-list-item>
            <template #prepend>
              <v-icon icon="mdi-badge-account" color="primary" class="mr-2" />
            </template>
            <v-list-item-title>Group ID</v-list-item-title>
            <v-list-item-subtitle>{{ groupId ?? '—' }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item v-if="teamInfo">
            <template #prepend>
              <v-icon icon="mdi-account-group" color="primary" class="mr-2" />
            </template>
            <v-list-item-title>Team</v-list-item-title>
            <v-list-item-subtitle>{{ teamInfo.name }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-sheet>
  </aside>
</template>

<script setup lang="ts">
import { useGroups } from '~/composables/useGroups'
import { useTeams } from '~/composables/useTeams'

interface Props {
  groupId?: string | null
  serviceId?: string | null
}

const props = defineProps<Props>()

defineEmits<{
  'clear-selection': []
}>()

const { data: groupsData } = await useGroups()
const { data: teamsData } = await useTeams()

const groupInfo = computed(() => {
  if (!props.groupId) return null
  return groupsData.value?.[props.groupId] ?? null
})

const teamInfo = computed(() => {
  const teamId = groupInfo.value?.teamId
  if (!teamId) return null
  return teamsData.value?.[teamId] ?? null
})

const groupTitle = computed(() => {
  if (groupInfo.value?.name) {
    return groupInfo.value.name
  }
  if (props.groupId) {
    return props.groupId
  }
  if (props.serviceId) {
    return props.serviceId
  }
  return 'Selection'
})
</script>

<style scoped>
.sidebar {
  width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
