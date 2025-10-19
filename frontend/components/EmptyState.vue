<template>
  <div class="loading-container">
    <q-card flat bordered class="q-pa-xl" style="max-width: 500px;">
      <q-card-section class="text-center">
        <div class="text-h1 text-grey-5">{{ icon }}</div>
        <div class="text-h5 text-grey-7 q-mt-md">{{ title }}</div>
        <p class="text-body1 text-grey-6 q-mt-sm">{{ message }}</p>
      </q-card-section>

      <q-card-actions v-if="onAction" align="center" class="q-pt-md">
        <q-btn
          @click="onAction"
          color="primary"
          :label="actionLabel"
          unelevated
          size="lg"
        />
      </q-card-actions>
    </q-card>
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

