<template>
  <div class="group-content">
    <div class="group-label internal">{{ data.label }}</div>
    <NodeResizer />
  </div>
</template>

<script setup lang="ts">
import { NodeResizer } from '@vue-flow/node-resizer'

// make sure to include the necessary styles!
import '@vue-flow/node-resizer/dist/style.css'

interface Props {
  data: {
    label: string
  }
}

defineProps<Props>()

// Declare Vue Flow internal events
defineEmits(['updateNodeInternals'])
</script>

<style scoped>
/* Style the node resizer to match internal group colors */
:deep(.vue-flow__resize-control.handle) {
  background-color: var(--q-primary);
  border-color: var(--q-primary);
}

:deep(.vue-flow__resize-control.line) {
  border-color: var(--q-primary);
}
</style>
