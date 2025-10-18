<template>
  <div class="node-wrapper">
    <Handle type="target" :position="Position.Left" />
    <div class="service-content">
      {{ data.label }}
    </div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps>()

</script>

<style scoped>

</style>
