<template>
  <div class="group-content">
    <div class="group-label external">{{ data.label }}</div>
    <NodeResizer />
  </div>
</template>

<script setup lang="ts">
import {NodeResizer} from "@vue-flow/node-resizer";

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
/* Style the node resizer to match external group colors */
:deep(.vue-flow__resize-control.handle) {
  background-color: var(--q-warning);
  border-color: var(--q-warning);
}

:deep(.vue-flow__resize-control.line) {
  border-color: var(--q-warning);
}
</style>
