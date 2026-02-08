<template>
  <div class="diagram-toolbar">
    <v-btn
      icon="mdi-home"
      variant="text"
      size="small"
      :disabled="pending"
      @click="$emit('go-home')"
    />
    <v-divider vertical class="mx-2" />
    <div v-if="label" class="toolbar-label text-body-2">{{ label }}</div>
    <v-spacer />
    <v-btn
      variant="text"
      size="small"
      :icon="hideIncomingConnections ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
      :color="hideIncomingConnections ? 'error' : 'primary'"
      :disabled="pending"
      @click="$emit('toggle-incoming')"
      :title="hideIncomingConnections ? 'Show incoming connections' : 'Hide incoming connections'"
    />
    <v-divider vertical class="mx-2" />
    <v-btn
      icon="mdi-bug-outline"
      color="secondary"
      variant="text"
      size="small"
      :disabled="pending"
      title="Log Mermaid UML"
      @click="$emit('log-diagram')"
    />
    <v-btn
      :icon="showLegend ? 'mdi-format-list-bulleted' : 'mdi-format-list-checkbox'"
      color="secondary"
      variant="text"
      size="small"
      :disabled="pending"
      :title="showLegend ? 'Hide legend' : 'Show legend'"
      @click="$emit('toggle-legend')"
    />
    <v-btn
      :icon="isDarkMode ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
      color="accent"
      variant="text"
      size="small"
      :disabled="pending"
      :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="$emit('toggle-dark-mode')"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  pending?: boolean
  hideIncomingConnections?: boolean
  showLegend: boolean
  isDarkMode: boolean
  label?: string
}

withDefaults(defineProps<Props>(), {
  pending: false,
  hideIncomingConnections: false,
  label: ''
})

defineEmits<{
  'go-home': []
  'toggle-incoming': []
  'toggle-legend': []
  'toggle-dark-mode': []
  'log-diagram': []
}>()
</script>

<style scoped>
.diagram-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 2;
}

.toolbar-label {
  font-weight: 500;
}

.v-theme--dark .diagram-toolbar {
  background-color: rgba(18, 18, 18, 0.9);
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
