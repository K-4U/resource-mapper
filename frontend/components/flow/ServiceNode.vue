<template>
  <div class="node-wrapper">
    <!-- Dynamic input handles based on incoming connection count - positioned on top -->
    <Handle
      v-for="index in incomingConnectionCount"
      :key="`input-top-${index - 1}`"
      :id="`input-top-${index - 1}`"
      type="target"
      :position="Position.Top"
      :style="getTopHandleStyle(index - 1, incomingConnectionCount)"
      class="service-handle input-handle"
    />

    <!-- Use Quasar card for consistent styling -->
    <q-card 
      :class="{
        'service-card': true,
        'external-service': isExternal,
        'selected': data.selected
      }"
      :flat="false"
      bordered
    >
      <q-card-section class="q-pa-sm">
        <div class="service-content">
          <AwsServiceIcon 
            :service-type="data.service.serviceType" 
            :size="32"
            class="service-icon"
          />
          <div class="service-name" :title="data.service.identifier">
            {{ data.label }}
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Dynamic output handles based on outgoing connection count - positioned on bottom -->
    <Handle
      v-for="index in outgoingConnectionCount"
      :key="`output-bottom-${index - 1}`"
      :id="`output-bottom-${index - 1}`"
      type="source"
      :position="Position.Bottom"
      :style="getBottomHandleStyle(index - 1, outgoingConnectionCount)"
      class="service-handle output-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()

// Calculate incoming connection count directly from the service data
const incomingConnectionCount = computed(() => {
  return Math.max(1, props.data?.incomingConnectionCount || 0)
})

// Calculate outgoing connection count
const outgoingConnectionCount = computed(() => {
  return Math.max(1, props.data?.outgoingConnectionCount || 0)
})

// Determine if this is an external service (based on parent node context or data)
const isExternal = computed(() => {
  return props.data?.isExternal || false
})

// Calculate top handle positions
function getTopHandleStyle(index: number, total: number): Record<string, string> {
  // Distribute handles evenly across the top edge
  const position = (index + 1) / (total + 1)
  return {
    left: `${position * 100}%`,
    transform: 'translateX(-50%)',
  }
}

// Calculate bottom handle positions
function getBottomHandleStyle(index: number, total: number): Record<string, string> {
  // Distribute handles evenly across the bottom edge
  const position = (index + 1) / (total + 1)
  return {
    left: `${position * 100}%`,
    transform: 'translateX(-50%)',
  }
}
</script>

<style scoped>
.node-wrapper {
  position: relative;
  min-height: 60px; /* Ensure minimum height for multiple handles */
}

.service-card {
  min-width: 140px;
  min-height: 60px;
  transition: all 0.2s ease;
}

.service-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-icon {
  flex-shrink: 0;
}

/* Handle styling */
.service-handle {
  width: 8px;
  height: 8px;
  background: var(--q-primary);
  border: 2px solid var(--q-primary);
  border-radius: 50%;
}

.service-handle.input-handle {
  background: var(--q-secondary);
  border-color: var(--q-secondary);
}

.service-handle.output-handle {
  background: var(--q-primary);
  border-color: var(--q-primary);
}

/* External services get warning theme */
.service-card.external-service {
  background-color: var(--q-warning);
  color: rgba(0, 0, 0, 0.87);
}

.service-card.external-service :deep(.q-card__section) {
  background-color: var(--q-warning);
}

/* Selected state using Quasar accent color */
.service-card.selected {
  border-color: var(--q-accent) !important;
  border-width: 3px !important;
  box-shadow: 0 0 10px rgba(var(--q-accent-rgb), 0.3);
}

.service-name {
  font-size: 0.875rem;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
