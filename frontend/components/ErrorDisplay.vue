<template>
  <div class="loading-container">
    <div style="max-width: 600px; padding: 20px;">
      <div style="background: #fee; border: 2px solid #c33; border-radius: 8px; padding: 30px;">
        <h2 style="color: #c33; margin: 0 0 15px 0;">⚠️ {{ title }}</h2>
        <p style="margin-bottom: 15px; color: #333; font-size: 16px;">
          {{ message }}
        </p>
        <div v-if="checkList && checkList.length > 0" style="background: #fff; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <strong>Please check:</strong>
          <ul style="margin: 10px 0; padding-left: 20px; text-align: left;">
            <li v-for="(item, index) in checkList" :key="index">{{ item }}</li>
          </ul>
        </div>
        <details v-if="technicalDetails" style="margin-top: 20px; text-align: left;">
          <summary style="cursor: pointer; color: #1976d2; font-weight: bold;">Technical Details</summary>
          <div style="position: relative;">
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; margin-top: 10px; font-size: 12px;">{{ technicalDetails }}</pre>
            <button
              @click="copyToClipboard"
              :class="{ 'copied': isCopied }"
              style="position: absolute; top: 15px; right: 15px; padding: 6px 12px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.2s;"
              :style="{ background: isCopied ? '#4caf50' : '#1976d2' }"
            >
              {{ isCopied ? '✓ Copied!' : '📋 Copy' }}
            </button>
          </div>
        </details>
        <div style="margin-top: 20px;">
          <button
            v-if="onRetry"
            @click="onRetry"
            style="margin-right: 10px; padding: 12px 24px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;"
          >
            🔄 Retry
          </button>
          <button
            v-if="onBack"
            @click="onBack"
            style="padding: 12px 24px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;"
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  message: string
  technicalDetails?: any
  checkList?: string[]
  onRetry?: () => void
  onBack?: () => void
}>()

const isCopied = ref(false)

async function copyToClipboard() {
  try {
    const text = typeof props.technicalDetails === 'string'
      ? props.technicalDetails
      : JSON.stringify(props.technicalDetails, null, 2)

    await navigator.clipboard.writeText(text)
    isCopied.value = true

    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
button:hover {
  opacity: 0.9;
}

button.copied {
  background: #4caf50 !important;
}
</style>

