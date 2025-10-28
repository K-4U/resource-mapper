<template>
  <div class="group-content">
    <!-- Keep the label positioning, use warning color for external -->
    <q-chip 
      class="group-label" 
      color="warning" 
      text-color="black"
      :label="data.label"
      square
    />
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
.group-content {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Keep label positioning as requested */
.group-label {
  position: absolute !important;
  top: -18px;
  left: -2px;
  font-weight: 600;
  font-size: 0.875rem;
  z-index: 10;
  border-radius: 4px 4px 0 0 !important;
}

/* Style the node resizer to match Quasar warning colors */
:deep(.vue-flow__resize-control.handle) {
  background-color: var(--q-warning);
  border-color: var(--q-warning);
}

:deep(.vue-flow__resize-control.line) {
  border-color: var(--q-warning);
}
</style>
