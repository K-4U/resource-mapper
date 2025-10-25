<template>
  <div style="position: relative;">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="internalNodeTypes"
      :edge-types="internalEdgeTypes"
      class="vue-flow-container"
      fit-view-on-init
      :default-viewport="defaultViewport"
      :min-zoom="minZoom"
      :max-zoom="maxZoom"
      :nodes-draggable="nodesDraggable"
      :elements-selectable="elementsSelectable"
      :auto-connect="autoConnect"
      :snap-to-grid="snapToGrid"
      :apply-changes="applyChanges"
      :delete-key-code="deleteKeyCode"
      :only-render-visible-nodes="onlyRenderVisibleNodes"
      :select-nodes-on-drag="selectNodesOnDrag"
      :pan-on-drag="panOnDrag"
      @node-click="onNodeClick"
      @node-double-click="onNodeDoubleClick"
      @error="onError"
      @node-drag-start="onNodeDragStart"
      @node-drag-stop="onNodeDragStop"
    >
      <Background :pattern-color="backgroundPatternColor" :gap="backgroundGap" />
      <Controls position="top-left">
        <!-- Navigation buttons -->
        <ControlButton
          v-if="showToolbar"
          @click="emit('goHome')"
          title="Home (Overview)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </ControlButton>
        
        <ControlButton
          v-if="showToolbar && canGoBack"
          @click="emit('goBack')"
          title="Back to Previous Group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </ControlButton>
        
        <!-- Connection visibility toggles -->
        <ControlButton
          v-if="showToolbar"
          @click="emit('toggleIncomingConnections')"
          :title="hideIncomingConnections ? 'Show Incoming Connections' : 'Hide Incoming Connections'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path v-if="hideIncomingConnections" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
            <path v-else d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </ControlButton>
        
        <ControlButton
          v-if="showToolbar"
          @click="emit('toggleExternalToExternal')"
          :title="hideExternalToExternal ? 'Show External-to-External Connections' : 'Hide External-to-External Connections'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path v-if="hideExternalToExternal" d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.96l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4V9.5C16 8.12 14.88 7 13.5 7S11 8.12 11 9.5v1.79l1.5 1.5V9.5c0-.55.45-1 1-1s1 .45 1 1V11h2.5zM2.27 2.27L1 3.54l2.78 2.78C2.66 6.82 2 8.34 2 10v6c0 1.1.9 2 2 2h11.46l2 2L18.73 19 2.27 2.27zM4 16V10c0-.64.16-1.26.44-1.8L14.46 18H4z"/>
            <path v-else d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </ControlButton>
        
        <!-- Legend toggle -->
        <ControlButton
          @click="showLegend = !showLegend"
          :title="showLegend ? 'Hide Legend' : 'Show Legend'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </ControlButton>
      </Controls>
      <MiniMap :position="minimapPosition" />
    </VueFlow>

    <!-- Floating Legend -->
    <div v-if="showLegend" class="floating-legend">
      <Legend />
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls, ControlButton } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { PathFindingEdge } from '@vue-flow/pathfinding-edge'
import type { Node, Edge } from '@vue-flow/core'
import GroupNodeVue from '~/components/flow/GroupNode.vue'
import ExternalGroupNode from '~/components/flow/ExternalGroupNode.vue'
import ServiceNodeVue from '~/components/flow/ServiceNode.vue'
import GroupNodeItem from '~/components/flow/GroupNodeItem.vue'
import Legend from '~/components/Legend.vue'

interface Props {
  nodes: Node[]
  edges: Edge[]
  nodeTypes?: Record<string, any>
  edgeTypes?: Record<string, any>

  defaultViewport?: { zoom: number; x?: number; y?: number }
  minZoom?: number
  maxZoom?: number
  nodesDraggable?: boolean
  elementsSelectable?: boolean
  autoConnect?: boolean
  snapToGrid?: boolean
  applyChanges?: boolean
  deleteKeyCode?: string | null
  onlyRenderVisibleNodes?: boolean
  selectNodesOnDrag?: boolean
  panOnDrag?: boolean
  backgroundPatternColor?: string
  backgroundGap?: number
  minimapPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  // Toolbar props
  showToolbar?: boolean
  canGoBack?: boolean
  hideIncomingConnections?: boolean
  hideExternalToExternal?: boolean
  toolbarPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

const props = withDefaults(defineProps<Props>(), {
  nodeTypes: () => ({}),
  edgeTypes: () => ({}),

  defaultViewport: () => ({ zoom: 1 }),
  minZoom: 0.2,
  maxZoom: 4,
  nodesDraggable: true,
  elementsSelectable: true,
  autoConnect: false,
  snapToGrid: false,
  applyChanges: true,
  deleteKeyCode: null,
  onlyRenderVisibleNodes: true,
  selectNodesOnDrag: false,
  panOnDrag: true,
  backgroundPatternColor: '#aaa',
  backgroundGap: 16,
  minimapPosition: 'bottom-left',
  showToolbar: false,
  canGoBack: false,
  hideIncomingConnections: false,
  hideExternalToExternal: false,
  toolbarPosition: 'top-right'
})

const emit = defineEmits<{
  nodeClick: [event: any]
  nodeDoubleClick: [event: any]
  error: [error: any]
  nodeDragStart: [event: any]
  nodeDragStop: [event: any]
  goHome: []
  goBack: []
  toggleIncomingConnections: []
  toggleExternalToExternal: []
}>()

// Legend visibility state
const showLegend = ref(true)

// Define internal node and edge types
const defaultNodeTypes = {
  'group': markRaw(GroupNodeVue) as any,
  'external-group': markRaw(ExternalGroupNode) as any,
  'service': markRaw(ServiceNodeVue) as any,
  'group-node': markRaw(GroupNodeItem) as any
}

const defaultEdgeTypes = {
  'pathfinding': markRaw(PathFindingEdge) as any
}

// Merge custom types with defaults (custom types take precedence)
const internalNodeTypes = computed(() => ({
  ...defaultNodeTypes,
  ...props.nodeTypes
}))

const internalEdgeTypes = computed(() => ({
  ...defaultEdgeTypes,
  ...props.edgeTypes
}))

function onNodeClick(event: any) {
  emit('nodeClick', event)
}

function onNodeDoubleClick(event: any) {
  emit('nodeDoubleClick', event)
}

function onError(error: any) {
  emit('error', error)
}

function onNodeDragStart(event: any) {
  emit('nodeDragStart', event)
}

function onNodeDragStop(event: any) {
  emit('nodeDragStop', event)
}
</script>

<style scoped>
.floating-legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  min-width: 250px;
  animation: slideInFromBottom 0.3s ease-out;
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Vue Flow ControlButton components have their own styling */
</style>
