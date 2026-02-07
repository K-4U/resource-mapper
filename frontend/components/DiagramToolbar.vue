<template>
  <div class="diagram-toolbar">
    <q-btn
      size="sm"
      icon="home"
      color="primary"
      flat
      round
      dense
      @click="$emit('go-home')"
      :disable="pending"
    />
    <q-separator vertical inset class="q-mx-sm" />
    <q-btn
      size="sm"
      :icon="hideIncomingConnections ? 'visibility_off' : 'visibility'"
      :color="hideIncomingConnections ? 'negative' : 'primary'"
      flat
      dense
      @click="$emit('toggle-incoming')"
      :disable="pending"
      :title="hideIncomingConnections ? 'Show incoming connections' : 'Hide incoming connections'"
    />
    <q-separator vertical inset class="q-mx-sm" />
    <q-btn
      size="sm"
      icon="bug_report"
      color="secondary"
      flat
      dense
      @click="$emit('log-diagram')"
      :disable="pending"
      title="Log Mermaid UML"
    />
    <q-btn
      size="sm"
      :icon="showLegend ? 'receipt_long' : 'menu'"
      color="secondary"
      flat
      dense
      @click="$emit('toggle-legend')"
      :disable="pending"
      :title="showLegend ? 'Hide legend' : 'Show legend'"
    />
    <q-btn
      size="sm"
      :icon="isDarkMode ? 'dark_mode' : 'light_mode'"
      color="accent"
      flat
      dense
      @click="$emit('toggle-dark-mode')"
      :disable="pending"
      :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  pending?: boolean
  hideIncomingConnections?: boolean
  showLegend: boolean
  isDarkMode: boolean
}

withDefaults(defineProps<Props>(), {
  pending: false,
  hideIncomingConnections: false,
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

.body--dark .diagram-toolbar {
  background-color: rgba(18, 18, 18, 0.9);
  border-color: rgba(255, 255, 255, 0.12);
}
</style>

