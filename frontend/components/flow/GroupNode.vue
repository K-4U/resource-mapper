<template>
  <div class="group-content">
    <div class="group-label internal">{{ data.label }}</div>
  </div>
</template>

<script setup lang="ts">
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
