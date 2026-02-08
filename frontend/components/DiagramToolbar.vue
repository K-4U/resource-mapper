<template>
  <v-toolbar density="comfortable" class="diagram-toolbar" border>
    <v-toolbar-items>
      <v-btn
        icon="mdi-home"
        variant="text"
        :disabled="pending"
        @click="$emit('go-home')"
      />
    </v-toolbar-items>

    <v-toolbar-title v-if="label" class="toolbar-label">{{ label }}</v-toolbar-title>

    <v-spacer />

    <v-toolbar-items class="actions">
      <v-btn
        variant="text"
        :icon="hideIncomingConnections ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        :color="hideIncomingConnections ? 'error' : 'primary'"
        :disabled="pending"
        @click="$emit('toggle-incoming')"
        :title="hideIncomingConnections ? 'Show incoming connections' : 'Hide incoming connections'"
      />
      <v-btn
        icon="mdi-bug-outline"
        color="secondary"
        variant="text"
        :disabled="pending"
        title="Log Mermaid UML"
        @click="$emit('log-diagram')"
      />
      <v-btn
        :icon="showLegend ? 'mdi-format-list-bulleted' : 'mdi-format-list-checkbox'"
        color="secondary"
        variant="text"
        :disabled="pending"
        :title="showLegend ? 'Hide legend' : 'Show legend'"
        @click="$emit('toggle-legend')"
      />
      <v-btn
        :icon="isDarkMode ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
        color="accent"
        variant="text"
        :disabled="pending"
        :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="$emit('toggle-dark-mode')"
      />
    </v-toolbar-items>
  </v-toolbar>
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
  width: 100%;
}

.toolbar-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  gap: 4px;
}
</style>
