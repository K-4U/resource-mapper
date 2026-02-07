<template>
  <aside class="sidebar">
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Service Details</q-toolbar-title>
      <q-btn icon="close" flat dense round @click="$emit('close')" />
    </q-toolbar>

    <q-scroll-area class="fit">
      <q-card flat bordered class="q-ma-md">
        <q-card-section>
          <div class="text-h6 q-mb-xs">{{ service.friendlyName }}</div>
          <div class="text-caption text-grey-7">{{ service.identifier }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-chip square color="accent" text-color="white">{{ service.serviceType }}</q-chip>
          <p v-if="service.description" class="q-mt-md text-body2">{{ service.description }}</p>
          <div v-else class="text-caption text-grey-7">No description provided.</div>
        </q-card-section>
      </q-card>
    </q-scroll-area>
  </aside>
</template>

<script setup lang="ts">
import type { ServiceDefinition } from '~/types'

interface Props {
  service: ServiceDefinition
}

defineProps<Props>()

defineEmits<{ close: [] }>()
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

