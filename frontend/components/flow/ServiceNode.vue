<template>
  <div class="node-wrapper">
    <!-- Dynamic input handles based on incoming connection count - positioned at top -->
    <Handle
      v-for="index in incomingConnectionCount"
      :key="`input-${index - 1}`"
      :id="`input-${index - 1}`"
      type="target"
      :position="Position.Top"
      :style="getHandleStyle(index - 1, incomingConnectionCount)"
    />

    <div class="service-content">
      <div class="name" :title="data.service.identifier">{{ data.label }}</div>
    </div>

    <!-- Single output handle - positioned at bottom -->
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()

// Calculate incoming connection count directly from the service data
const incomingConnectionCount = computed(() => {
  return props.data?.service?.incomingConnections?.length || 0
})

// Calculate handle position based on index and total count
function getHandleStyle(index: number, total: number) {
  if (total <= 1) {
    return { left: '50%' }
  }

  // Distribute handles evenly along the top side
  const spacing = 80 / (total + 1) // Use 80% of the width
  const leftOffset = 10 + spacing * (index + 1) // Start at 10% from left

  return {
    left: `${leftOffset}%`
  }
}
</script>

<style scoped>
.service-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-wrapper {
  position: relative;
  min-height: 60px; /* Ensure minimum height for multiple handles */
}
</style>
