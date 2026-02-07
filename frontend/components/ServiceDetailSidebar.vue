<template>
  <aside class="sidebar">
    <q-scroll-area class="fit">
      <q-card flat bordered class="q-ma-md">
        <q-card-section class="bg-primary text-white">
          <div class="text-caption text-uppercase">Group</div>
          <div class="text-h6">{{ group.name }}</div>
          <div class="text-body2 q-mt-sm" v-if="group.description">{{ group.description }}</div>
          <div class="text-caption text-white-7 q-mt-sm">ID: {{ group.groupName }}</div>
          <div v-if="group.teamId" class="text-caption text-white-7">Team: {{ group.teamId }}</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-ma-md">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-caption text-uppercase">Service</div>
            <div class="text-h6 q-mt-xs">
              {{ service ? service.friendlyName : 'Select a service' }}
            </div>
          </div>
          <q-btn
            v-if="service"
            icon="clear"
            flat
            dense
            round
            @click="$emit('clear-service')"
            :aria-label="'Clear selected service'"
          />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="service">
          <div class="text-caption text-grey-7">{{ service.identifier }}</div>
          <q-chip square color="accent" text-color="white" class="q-mt-sm">
            {{ service.serviceType }}
          </q-chip>
          <p v-if="service.description" class="q-mt-md text-body2">{{ service.description }}</p>
          <div v-else class="text-caption text-grey-7 q-mt-md">No description provided.</div>
        </q-card-section>

        <q-card-section v-else class="text-caption text-grey-7">
          Click a service node in the diagram to see its details here.
        </q-card-section>
      </q-card>
    </q-scroll-area>
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
  background-color: #f5f5f5;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}
</style>
