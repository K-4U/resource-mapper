<template>
  <v-card class="legend" variant="outlined">
    <v-card-title class="py-3 d-flex align-center">
      <v-icon class="mr-2" icon="mdi-information" />
      Legend
    </v-card-title>
    <v-divider />
    <v-card-text class="py-0">
      <v-list density="compact">
        <v-list-item v-for="item in legendItems" :key="item.label" class="px-0">
          <template #prepend>
            <v-avatar
              v-if="item.kind === 'box'"
              size="28"
              :color="item.color"
              variant="tonal"
              class="mr-3"
            />
            <v-icon
              v-else
              :color="item.color"
              class="mr-3"
              icon="mdi-minus"
            />
          </template>
          <v-list-item-title class="text-body-2">{{ item.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const legendItems = [
  { label: 'Internal Group', color: 'primary', kind: 'box' },
  { label: 'External Group', color: 'warning', kind: 'box' },
  { label: 'Internal Service', color: 'surface-variant', kind: 'box' },
  { label: 'External Service', color: 'warning', kind: 'box' },
  { label: 'Internal Connection', color: 'primary', kind: 'line' },
  { label: 'Incoming Connection', color: 'success', kind: 'line' },
  { label: 'Outgoing Connection', color: 'info', kind: 'line' },
  { label: 'External-to-External', color: 'secondary', kind: 'line' }
]
</script>

<style scoped>
.legend {
  min-width: 220px;
}
</style>
