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

</style>
