<template>
  <div class="node-wrapper">
    <Handle type="target" :position="Position.Left" />
    <div class="service-content">
      <div class="name" :title="data.service.identifier">{{ data.label }}</div>
      <Handle type="source" :position="Position.Right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()

</script>

<style scoped>

.service-content { display:flex; flex-direction:column; gap:4px; align-items:center; }
.name { max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

</style>
