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
      @error="onError"
      @node-drag-start="onNodeDragStart"
      @node-drag-stop="onNodeDragStop"
    >
      <Background :pattern-color="backgroundPatternColor" :gap="backgroundGap" />
      <Controls />
      <MiniMap :position="minimapPosition" />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { PathFindingEdge } from '@vue-flow/pathfinding-edge'
import type { Node, Edge } from '@vue-flow/core'
import GroupNodeVue from '~/components/flow/GroupNode.vue'
import ExternalGroupNode from '~/components/flow/ExternalGroupNode.vue'
import ServiceNodeVue from '~/components/flow/ServiceNode.vue'
import GroupNodeItem from '~/components/flow/GroupNodeItem.vue'

interface Props {
  nodes: Node[]
  edges: Edge[]
  nodeTypes?: Record<string, any>
  edgeTypes?: Record<string, any>
  legendType?: 'index' | 'group'
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
}

const props = withDefaults(defineProps<Props>(), {
  nodeTypes: () => ({}),
  edgeTypes: () => ({}),
  legendType: 'index',
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
  minimapPosition: 'bottom-left'
})

const emit = defineEmits<{
  nodeClick: [event: any]
  error: [error: any]
  nodeDragStart: [event: any]
  nodeDragStop: [event: any]
}>()

// Define internal node and edge types
const defaultNodeTypes = {
  'group': markRaw(GroupNodeVue),
  'external-group': markRaw(ExternalGroupNode),
  'service': markRaw(ServiceNodeVue),
  'group-node': markRaw(GroupNodeItem)
}

const defaultEdgeTypes = {
  'pathfinding': markRaw(PathFindingEdge)
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
/* Component-specific styles can go here if needed */
</style>
