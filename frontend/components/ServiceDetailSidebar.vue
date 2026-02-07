<template>
  <aside class="sidebar">
    <v-sheet class="d-flex flex-column fill-height" elevation="0">
      <v-card variant="outlined" class="ma-4">
        <v-card-text class="bg-primary text-white">
          <div class="text-caption text-uppercase">Group</div>
          <div class="text-h6">{{ group.name }}</div>
          <div v-if="group.description" class="text-body-2 mt-2">{{ group.description }}</div>
          <div class="text-caption mt-2">ID: {{ group.groupName }}</div>
          <div v-if="group.teamId" class="text-caption">Team: {{ group.teamId }}</div>
        </v-card-text>
      </v-card>

      <v-card variant="outlined" class="ma-4">
        <v-card-text class="d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-uppercase">Service</div>
            <div class="text-h6 mt-1">{{ service ? service.friendlyName : 'Select a service' }}</div>
          </div>
          <v-btn
            v-if="service"
            icon="mdi-close"
            variant="text"
            density="comfortable"
            @click="$emit('clear-service')"
            :aria-label="'Clear selected service'"
          />
        </v-card-text>
        <v-divider />
        <v-card-text v-if="service">
          <div class="text-caption text-medium-emphasis">{{ service.identifier }}</div>
          <v-chip class="mt-3" color="secondary" text-color="white" variant="flat">
            {{ service.serviceType }}
          </v-chip>
          <p v-if="service.description" class="mt-4 text-body-2">{{ service.description }}</p>
          <div v-else class="text-caption text-medium-emphasis mt-4">No description provided.</div>
        </v-card-text>
        <v-card-text v-else class="text-caption text-medium-emphasis">
          Click a service node in the diagram to see its details here.
        </v-card-text>
      </v-card>
    </v-sheet>
  </aside>
</template>

<script setup lang="ts">
import type { GroupInfo, ServiceDefinition } from '~/types'

interface Props {
  group: GroupInfo
  service?: ServiceDefinition | null
}

defineProps<Props>()

defineEmits<{ 'clear-service': [] }>()
</script>

<style scoped>
.sidebar {
  width: 340px;
  max-width: 35vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
