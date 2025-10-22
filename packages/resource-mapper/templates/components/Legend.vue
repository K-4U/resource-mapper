<template>
  <q-card class="legend">
    <q-card-section class="q-pb-sm">
      <div class="text-subtitle1 text-weight-medium">Legend</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-list dense>
        <q-item v-for="item in legendItems" :key="item.label" class="q-px-none">
          <q-item-section avatar class="min-width-auto">
            <div
              class="legend-color"
              :style="{
                backgroundColor: item.bg,
                borderColor: item.border
              }"
            ></div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-body2">{{ item.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
interface Props {
  type?: 'group' | 'index'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'index'
})

const legendItems = computed(() => {
  if (props.type === 'group') {
    return [
      { label: 'Internal Group', bg: 'rgba(227, 242, 253, 0.4)', border: 'var(--q-primary)' },
      { label: 'External Group', bg: 'rgba(255, 249, 196, 0.4)', border: 'var(--q-warning)' },
      { label: 'Internal Service', bg: '#c8e6c9', border: 'var(--q-positive)' },
      { label: 'External Service', bg: '#fff9c4', border: 'var(--q-warning)' }
    ]
  } else {
    return [
      { label: 'Group', bg: '#e3f2fd', border: 'var(--q-primary)' }
    ]
  }
})
</script>

<style scoped>
.legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 200px;
}

.legend-color {
  width: 30px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid;
}

.min-width-auto {
  min-width: auto !important;
}
</style>

