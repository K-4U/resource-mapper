<template>
  <div class="group-content">
    <!-- Keep the label positioning as requested -->
    <q-chip 
      class="group-label" 
      :color="'primary'" 
      text-color="white" 
      :label="data.label"
      square
    />
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

/* Style the node resizer to match Quasar primary colors */
:deep(.vue-flow__resize-control.handle) {
  background-color: var(--q-primary);
  border-color: var(--q-primary);
}

:deep(.vue-flow__resize-control.line) {
  border-color: var(--q-primary);
}
</style>
