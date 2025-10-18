<template>
  <div class="legend">
    <div class="legend-title">Legend</div>
    <div v-for="item in legendItems" :key="item.label" class="legend-item">
      <div
        class="legend-color"
        :style="{
          backgroundColor: item.bg,
          borderColor: item.border
        }"
      ></div>
      <span class="legend-label">{{ item.label }}</span>
    </div>
  </div>
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
      { label: 'Internal Group', bg: 'rgba(227, 242, 253, 0.4)', border: '#1976d2' },
      { label: 'External Group', bg: 'rgba(255, 249, 196, 0.4)', border: '#f57c00' },
      { label: 'Internal Service', bg: '#c8e6c9', border: '#388e3c' },
      { label: 'External Service', bg: '#fff9c4', border: '#f57c00' }
    ]
  } else {
    return [
      { label: 'Group', bg: '#e3f2fd', border: '#1976d2' }
    ]
  }
})
</script>

