<template>
  <div class="loading-container">
    <div style="text-align: center;">
      <div style="font-size: 3rem; color: #1976d2; animation: spin 1s linear infinite;">⟳</div>
      <p style="margin-top: 20px; font-size: 18px; color: #666;">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>