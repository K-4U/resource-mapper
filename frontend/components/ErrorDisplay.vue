<template>
  <div class="loading-container">
    <div style="max-width: 600px;">
      <v-card class="pa-6" variant="outlined">
        <v-card-title class="text-error d-flex align-center">
          <v-icon icon="mdi-alert" class="mr-2" />
          {{ title }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-1">{{ message }}</p>
        </v-card-text>

        <v-card-text v-if="checkList?.length">
          <v-sheet class="pa-3" color="surface-variant" rounded="lg" variant="tonal">
            <div class="text-subtitle-2 mb-2">Please check:</div>
            <v-list density="compact">
              <v-list-item v-for="(item, index) in checkList" :key="index">
                <template #prepend>
                  <v-icon icon="mdi-check-circle" color="primary" class="mr-2" />
                </template>
                <v-list-item-title>{{ item }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-sheet>
        </v-card-text>

        <v-card-text v-if="technicalDetails">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-primary text-subtitle-2">
                <v-icon icon="mdi-code-tags" class="mr-2" />
                Technical Details
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-sheet color="surface-variant" rounded="lg" class="pa-3 position-relative">
                  <pre class="text-caption" style="white-space: pre-wrap; word-wrap: break-word;">{{ formattedDetails }}</pre>
                  <v-btn
                    class="copy-btn"
                    :color="isCopied ? 'success' : 'primary'"
                    size="small"
                    :text="isCopied ? 'Copied!' : 'Copy'"
                    :prepend-icon="isCopied ? 'mdi-check' : 'mdi-content-copy'"
                    @click="copyToClipboard"
                  />
                </v-sheet>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-card-actions class="justify-center mt-4">
          <v-btn
            v-if="onRetry"
            color="primary"
            variant="flat"
            prepend-icon="mdi-refresh"
            @click="onRetry"
          >Retry</v-btn>
          <v-btn
            v-if="onBack"
            color="secondary"
            variant="text"
            prepend-icon="mdi-arrow-left"
            @click="onBack"
          >Back to Overview</v-btn>
        </v-card-actions>
      </v-card>
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

const formattedDetails = computed(() => {
  if (!props.technicalDetails) {
    return ''
  }
  return typeof props.technicalDetails === 'string'
    ? props.technicalDetails
    : JSON.stringify(props.technicalDetails, null, 2)
})

function copyToClipboard() {
  if (!formattedDetails.value) {
    return
  }
  navigator.clipboard.writeText(formattedDetails.value).then(() => {
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  })
}
</script>

<style scoped>
.copy-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}
</style>
