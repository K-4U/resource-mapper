<template>
  <div class="loading-container">
    <div style="text-align: center;">
      <q-spinner-dots
        color="primary"
        size="80px"
      />
      <p class="text-h6 q-mt-md text-grey-7">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

