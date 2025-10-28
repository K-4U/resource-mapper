<template>
  <div class="overview-group-node">
    <!-- Input handles - positioned on left side -->
    <Handle
      v-for="index in incomingConnectionCount"
      :key="`input-left-${index - 1}`"
      :id="`input-left-${index - 1}`"
      type="target"
      :position="Position.Left"
      :style="getLeftHandleStyle(index - 1, incomingConnectionCount)"
    />

    <!-- Group content -->
    <div class="group-content">
      <div class="group-name">{{ data.label }}</div>
    </div>

    <!-- Output handles - positioned on right side -->
    <Handle
      v-for="index in outgoingConnectionCount"
      :key="`output-right-${index - 1}`"
      :id="`output-right-${index - 1}`"
      type="source"
      :position="Position.Right"
      :style="getRightHandleStyle(index - 1, outgoingConnectionCount)"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()

// Calculate connection counts from the group data
const incomingConnectionCount = computed(() => {
  return Math.max(1, props.data?.totalIncomingCount || 0)
})

const outgoingConnectionCount = computed(() => {
  return Math.max(1, props.data?.totalOutgoingCount || 0)
})

// Calculate handle position for left side (incoming)
function getLeftHandleStyle(index: number, total: number) {
  if (total <= 1) {
    return { top: '50%' }
  }

  if (total === 2) {
    // For 2 handles: topmost and bottommost
    return index === 0 ? { top: '20%' } : { top: '80%' }
  }

  // For 3+ handles: distribute with topmost at top, bottommost at bottom
  if (index === 0) {
    return { top: '20%' } // Topmost handle
  } else if (index === total - 1) {
    return { top: '80%' } // Bottommost handle
  } else {
    // Middle handles distributed evenly
    const middleSpacing = 60 / (total - 1) // Space between top (20%) and bottom (80%)
    const topOffset = 20 + middleSpacing * index
    return { top: `${topOffset}%` }
  }
}

// Calculate handle position for right side (outgoing)
function getRightHandleStyle(index: number, total: number) {
  if (total <= 1) {
    return { top: '50%' }
  }

  if (total === 2) {
    // For 2 handles: topmost and bottommost
    return index === 0 ? { top: '20%' } : { top: '80%' }
  }

  // For 3+ handles: distribute with topmost at top, bottommost at bottom
  if (index === 0) {
    return { top: '20%' } // Topmost handle
  } else if (index === total - 1) {
    return { top: '80%' } // Bottommost handle
  } else {
    // Middle handles distributed evenly
    const middleSpacing = 60 / (total - 1) // Space between top (20%) and bottom (80%)
    const topOffset = 20 + middleSpacing * index
    return { top: `${topOffset}%` }
  }
}


</script>

<style scoped>
.overview-group-node {
  position: relative;
  min-width: 150px;
  min-height: 80px;
  background: white;
  border: 2px solid var(--q-primary);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.group-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.group-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--q-primary);
  margin-bottom: 4px;
}

/* Dark mode support */
.body--dark .overview-group-node {
  background: var(--q-dark-page);
  border-color: var(--q-primary);
}

.body--dark .group-name {
  color: var(--q-primary);
}
</style>