<template>
  <div class="loading-container">
    <div class="text-center">
      <v-progress-circular
        color="primary"
        size="80"
        width="8"
        indeterminate
      />
      <p class="text-h6 mt-4 text-medium-emphasis">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>
