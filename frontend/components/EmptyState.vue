<template>
  <div class="loading-container">
    <v-card variant="outlined" class="pa-8" max-width="500">
      <v-card-text class="text-center">
        <div class="text-h2 text-medium-emphasis">{{ icon }}</div>
        <div class="text-h5 text-high-emphasis mt-4">{{ title }}</div>
        <p class="text-body-1 text-medium-emphasis mt-2">{{ message }}</p>
      </v-card-text>
      <v-card-actions v-if="onAction" class="justify-center">
        <v-btn
          color="primary"
          :text="actionLabel"
          size="large"
          @click="onAction"
        />
      </v-card-actions>
    </v-card>
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
