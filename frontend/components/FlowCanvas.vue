<template>
  <div class="diagram-container">
    <DiagramToolbar
        :pending="pending"
        :can-go-back="canGoBack"
        :hide-incoming-connections="hideIncomingConnections"
        :hide-external-to-external="hideExternalToExternal"
        :show-legend="showLegend"
        :is-dark-mode="isDarkMode.value"
        @go-home="emit('goHome')"
        @go-back="emit('goBack')"
        @toggle-incoming="emit('toggleIncomingConnections')"
        @toggle-external-to-external="emit('toggleExternalToExternal')"
        @toggle-legend="showLegend = !showLegend"
        @toggle-dark-mode="toggleDarkMode"
        @log-diagram="logCurrentDiagram"
    />

    <div class="diagram-surface" :class="{ 'is-loading': pending }" ref="diagramSurfaceRef">
      <ClientOnly>
        <VueMermaidString
            v-show="renderableDiagram"
            :key="diagramRenderKey"
            :value="renderableDiagram"
            :options="mermaidOptions"
            @node-click="onMermaidNodeClick"
            @parse-error="handleParseError"
        />
      </ClientOnly>
      <div v-if="!hasDiagram && !pending" class="diagram-placeholder">
        <slot name="empty">No diagram available.</slot>
      </div>
    </div>

    <div v-if="showLegend && !pending" class="floating-legend">
      <Legend/>
    </div>

    <q-banner v-if="parseError" class="diagram-error bg-negative text-white">
      {{ parseError }}
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import VueMermaidString from 'vue-mermaid-string'
import type {MermaidConfig} from 'mermaid'
import mermaid from 'mermaid'
import Legend from '~/components/Legend.vue'
import DiagramToolbar from '~/components/DiagramToolbar.vue'
import {withDiagramConfig} from '~/utils/mermaid/diagramHelpers'

interface Props {
  diagram: string
  pending?: boolean
  showToolbar?: boolean
  canGoBack?: boolean
  hideIncomingConnections?: boolean
  hideExternalToExternal?: boolean
  mermaidOptions?: MermaidConfig
}

const props = withDefaults(defineProps<Props>(), {
  diagram: '',
  pending: false,
  showToolbar: false,
  canGoBack: false,
  hideIncomingConnections: false,
  hideExternalToExternal: false,
  mermaidOptions: () => ({})
})

const emit = defineEmits<{
  nodeClick: [nodeId: string]
  nodeDoubleClick: [nodeId: string]
  goHome: []
  goBack: []
  toggleIncomingConnections: []
  toggleExternalToExternal: []
}>()

const showLegend = ref(true)
const parseError = ref<string>('')
const PLACEHOLDER_DIAGRAM = 'architecture-beta\nservice placeholder(server)["No data yet"]'

const hasDiagram = computed(() => !!props.diagram?.trim())
const renderableDiagram = computed(() =>
    hasDiagram.value
        ? withDiagramConfig(props.diagram)
        : PLACEHOLDER_DIAGRAM
)
const diagramRenderKey = computed(() => `${renderableDiagram.value}::${isDarkMode.value ? 'dark' : 'default'}`)

const {$q} = useNuxtApp()
const isDarkMode = computed(() => $q.dark.isActive)

const mermaidOptions = computed(() => ({
  theme: isDarkMode.value ? 'dark' : 'default',
  securityLevel: 'loose',
  logLevel: 'info',
  architecture: {
    padding: 32
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis'
  },
  ...props.mermaidOptions
}))

watch(() => props.diagram, () => {
  parseError.value = ''
})

watch(renderableDiagram, () => {
  if (!import.meta.client) {
    return
  }
})

onMounted(() => {
  if (import.meta.client) {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      $q.dark.set(savedDarkMode === 'true')
    }
  }
})


console.debug('[Mermaid Icons] Registering Mermaid icon packs for current view')
try {
  mermaid.registerIconPacks([
    {
      name: 'logos',
      loader: () => {
        console.debug("[Mermaid Icons] Loading 'logos' icon pack from unpkg.com");
        return import('@iconify-json/logos').then((module) => module.icons);
      }
    }
  ])
  console.debug('[Mermaid Icons] Icon packs ready')
} catch (error) {
  console.warn('Unable to register AWS icon pack for mermaid:', error)
}


const DOUBLE_CLICK_THRESHOLD_MS = 400
let lastClickedNode: string | null = null
let lastClickTimestamp = 0

function toggleDarkMode() {
  $q.dark.toggle()
  if (import.meta.client) {
    localStorage.setItem('darkMode', $q.dark.isActive.toString())
  }
}

function onMermaidNodeClick(nodeId: string) {
  const now = Date.now()
  if (lastClickedNode === nodeId && now - lastClickTimestamp <= DOUBLE_CLICK_THRESHOLD_MS) {
    emit('nodeDoubleClick', nodeId)
    lastClickedNode = null
    lastClickTimestamp = 0
    return
  }
  lastClickedNode = nodeId
  lastClickTimestamp = now
  emit('nodeClick', nodeId)
}

function handleParseError(error: unknown) {
  if (error instanceof Error) {
    parseError.value = error.message
  } else {
    parseError.value = 'Failed to render diagram.'
  }
}

function logCurrentDiagram() {
  const diagram = renderableDiagram.value
  if (!import.meta.client) {
    return
  }
  if (!diagram?.trim()) {
    console.info('[Mermaid UML] No diagram available yet')
  } else if (diagram === PLACEHOLDER_DIAGRAM) {
    console.info('[Mermaid UML] Placeholder diagram rendered')
  } else {
    console.info('[Mermaid UML]', '\n' + diagram)
  }
}
</script>

<style scoped>
.diagram-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.diagram-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 2;
}

.body--dark .diagram-toolbar {
  background-color: rgba(18, 18, 18, 0.9);
  border-color: rgba(255, 255, 255, 0.12);
}

.diagram-surface {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background-color: var(--q-grey-1);
}

.body--dark .diagram-surface {
  background-color: var(--q-dark-page);
}

.diagram-surface.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

.diagram-placeholder {
  width: 100%;
  height: 100%;
  border: 1px dashed var(--q-grey-5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-grey-7);
}

.floating-legend {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 3;
  max-width: 320px;
}

.diagram-error {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
