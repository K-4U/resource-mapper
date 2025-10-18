<template>
  <div class="loading-container">
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 4rem; color: #999;">{{ icon }}</div>
      <h2 style="color: #666; margin-top: 20px;">{{ title }}</h2>
      <p style="color: #999;">{{ message }}</p>
      <button
        v-if="onAction"
        @click="onAction"
        style="margin-top: 20px; padding: 12px 24px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}>()
</script>

<style scoped>
button:hover {
  opacity: 0.9;
}
</style>


