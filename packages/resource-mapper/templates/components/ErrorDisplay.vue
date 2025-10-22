<template>
  <div class="loading-container">
    <div style="max-width: 600px;">
      <q-card class="q-pa-lg">
        <q-card-section>
          <div class="text-h5 text-negative">
            <q-icon name="warning" size="md" class="q-mr-sm" />
            {{ title }}
          </div>
        </q-card-section>

        <q-card-section>
          <p class="text-body1">{{ message }}</p>
        </q-card-section>

        <q-card-section v-if="checkList && checkList.length > 0">
          <q-card bordered flat class="bg-grey-2">
            <q-card-section>
              <div class="text-weight-bold q-mb-sm">Please check:</div>
              <q-list dense>
                <q-item v-for="(item, index) in checkList" :key="index">
                  <q-item-section avatar>
                    <q-icon name="check_circle" color="primary" size="xs" />
                  </q-item-section>
                  <q-item-section>{{ item }}</q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </q-card-section>

        <q-card-section v-if="technicalDetails">
          <q-expansion-item
            icon="code"
            label="Technical Details"
            header-class="text-primary text-weight-bold"
          >
            <q-card bordered flat class="bg-grey-2 q-mt-sm">
              <q-card-section class="relative-position">
                <pre class="text-caption" style="white-space: pre-wrap; word-wrap: break-word;">{{ technicalDetails }}</pre>
                <q-btn
                  @click="copyToClipboard"
                  :icon="isCopied ? 'check' : 'content_copy'"
                  :color="isCopied ? 'positive' : 'primary'"
                  :label="isCopied ? 'Copied!' : 'Copy'"
                  size="sm"
                  class="absolute-top-right q-ma-sm"
                  dense
                  unelevated
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-card-section>

        <q-card-actions align="center" class="q-pt-md">
          <q-btn
            v-if="onRetry"
            @click="onRetry"
            color="primary"
            label="Retry"
            icon="refresh"
            unelevated
            size="md"
            class="q-mr-sm"
          />
          <q-btn
            v-if="onBack"
            @click="onBack"
            color="grey-7"
            label="Back to Overview"
            icon="arrow_back"
            unelevated
            size="md"
          />
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'

const props = defineProps<{
  title: string
  message: string
  technicalDetails?: any
  checkList?: string[]
  onRetry?: () => void
  onBack?: () => void
}>()

const $q = useQuasar()
const isCopied = ref(false)

function copyToClipboard() {
  const text = typeof props.technicalDetails === 'string'
    ? props.technicalDetails
    : JSON.stringify(props.technicalDetails, null, 2)

  navigator.clipboard.writeText(text).then(() => {
    isCopied.value = true
    $q.notify({
      type: 'positive',
      message: 'Error details copied to clipboard',
      position: 'top',
      timeout: 2000
    })
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  })
}
</script>

