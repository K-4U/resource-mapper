<template>
  <div class="node-wrapper">
    <Handle
      type="target"
      :position="Position.Right"
      id="target-right"
    />
    <div class="group-node-content">
      {{ data.label }}
      <span v-if="data.serviceCount" class="service-count">({{ data.serviceCount }} services)</span>
    </div>
    <Handle
      type="source"
      :position="Position.Left"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

interface Props {
  data: {
    label: string
    serviceCount?: number
  }
}

defineProps<Props>()
</script>

<style scoped>
.node-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}

.group-node-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
}

.service-count {
  font-size: 10px;
  opacity: 0.6;
  font-weight: normal;
}
</style>
