<template>
  <q-card class="legend">
    <q-card-section class="bg-indigo-1">
      <div class="text-subtitle2 text-indigo-9 q-mb-xs">
        <q-icon name="info" class="q-mr-sm" />
        Legend
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-list dense>
        <q-item v-for="item in legendItems" :key="item.label" class="q-px-none">
          <q-item-section avatar class="min-width-auto">
            <!-- For groups and services (boxes) -->
            <div
              v-if="item.type !== 'connection'"
              class="legend-color"
              :style="{
                backgroundColor: item.bg,
                borderColor: item.border
              }"
            ></div>
            <!-- For connections (lines) -->
            <div
              v-else
              class="legend-line"
              :style="{
                backgroundColor: item.color
              }"
            ></div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-body2">{{ item.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// No props needed - legend always shows the same items
const legendItems = [
  // Groups
  { label: 'Internal Group', bg: 'rgba(227, 242, 253, 0.4)', border: 'var(--q-primary)', type: 'group' },
  { label: 'External Group', bg: 'rgba(255, 249, 196, 0.4)', border: 'var(--q-warning)', type: 'group' },
  // Services
  { label: 'Internal Service', bg: '#c8e6c9', border: 'var(--q-positive)', type: 'service' },
  { label: 'External Service', bg: '#fff9c4', border: 'var(--q-warning)', type: 'service' },
  // Connections
  { label: 'Internal Connection', color: '#1976D2', type: 'connection' },
  { label: 'Incoming Connection', color: '#388E3C', type: 'connection' },
  { label: 'Outgoing Connection', color: '#F57C00', type: 'connection' },
  { label: 'External-to-External', color: '#7B1FA2', type: 'connection' }
]
</script>

<style scoped>
.legend {
  min-width: 200px;
}

.legend-color {
  width: 30px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid;
}

.legend-line {
  width: 30px;
  height: 3px;
  border-radius: 1px;
}

.min-width-auto {
  min-width: auto !important;
}
</style>

