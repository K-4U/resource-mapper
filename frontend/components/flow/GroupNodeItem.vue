<template>
  <div class="node-wrapper">
    <Handle type="target" :position="Position.Left" />
    <div class="group-node-content">
      {{ data.label }}
    </div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

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
.node-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.group-node-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  word-wrap: break-word;
}
</style>
