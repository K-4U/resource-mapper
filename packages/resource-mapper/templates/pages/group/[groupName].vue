<template>
  <div class="page-container">
    <!-- Floating back button -->
    <q-btn
        fab
        icon="arrow_back"
        color="primary"
        @click="router.push('/')"
        class="back-button"
        size="md"
    >
      <q-tooltip>Back to Overview</q-tooltip>
    </q-btn>

    <LoadingSpinner v-if="pending" message="Loading group details..."/>

    <ErrorDisplay
        v-else-if="error"
        title="Error Loading Group"
        :message="`Failed to load services for group: ${groupName}`"
        :technical-details="error"
        :check-list="[
        'Is the Spring Boot backend running?',
        'Does this group exist?',
        'Check the browser console (F12) for more details'
      ]"
        :on-retry="refreshData"
        :on-back="() => router.push('/')"
    />

    <EmptyState
        v-else-if="!nodes || nodes.length === 0"
        icon="📦"
        title="No Services in This Group"
        :message="`Group '${groupName}' exists but has no services defined.`"
        action-label="← Back to Overview"
        :on-action="() => router.push('/')"
    />

    <div v-else class="content-with-sidebar">
      <div class="flow-canvas-wrapper">
        <FlowCanvas
            :nodes="nodes"
            :edges="edges"
            @error="handleError"
            @node-click="handleNodeClick"
            @node-drag-start="onNodeDragStart"
            @node-drag-stop="onNodeDragStop"
        />
      </div>

      <GroupDetailSidebar
          :group-name="capitalizedGroupName"
          :group-description="groupInfo?.description"
          :service-count="serviceCount"
          :connection-count="connectionCount"
          :external-group-count="externalGroupCount"
          :selected-item="selectedItem"
          :team-id="groupInfo?.teamId"
          @clear-selection="clearSelection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {type Edge, type Node} from '@vue-flow/core'
import {useGroupGraph} from '~/composables/useGroupGraph'
import type {GroupInfo} from '~/generated/api/src'

const router = useRouter()
const route = useRoute()
const api = useApi()

const groupName = route.params.groupName as string

const capitalizedGroupName = computed(() =>
    groupName.charAt(0).toUpperCase() + groupName.slice(1).toLowerCase()
)

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const groupInfo = ref<GroupInfo | null>(null)
const selectedItem = ref<any>(null)
const selectedNodeId = ref<string | null>(null)

const serviceCount = computed(() => {
  return nodes.value.filter(n => n.type === 'service').length
})

const connectionCount = computed(() => {
  return edges.value.length
})

const externalGroupCount = computed(() => {
  return nodes.value.filter(n => n.type === 'external-group').length
})

const {pending, error, refresh} = await useAsyncData(
    `group-${groupName}`,
    async () => {
      console.log(`Fetching data for group: ${groupName}`)
      const [services, allServices, info] = await Promise.all([
        api.getServicesByGroup(groupName),
        api.getAllServices(),
        api.getGroupInfo(groupName).catch(() => null)
      ])

      console.log(`Data loaded for group ${groupName}:`, {services, allServices, info})
      groupInfo.value = info

      const {buildGraph} = useGroupGraph()
      const {nodes: graphNodes, edges: graphEdges} = buildGraph(
          services,
          allServices,
          groupName,
          capitalizedGroupName.value
      )

      nodes.value = graphNodes
      edges.value = graphEdges

      return {services, allServices, info}
    },
    {
      server: false
    }
)

function refreshData() {
  refresh()
}

function handleError(error: any) {
  console.error('Flow canvas error:', error)
}

function onNodeDragStart() {
  // Animation disabled during drag
}

function onNodeDragStop() {
  // Animation re-enabled after drag
}

function clearAllSelections() {
  // Clear selected class from all nodes
  nodes.value.forEach(node => {
    if (node.class && typeof node.class === 'string') {
      node.class = node.class.replace(/\s*selected\s*/g, ' ').trim()
    }
  })

  // Clear highlighted class from all edges
  edges.value.forEach(edge => {
    if (edge.class && typeof edge.class === 'string') {
      edge.class = edge.class.replace(/\s*highlighted\s*/g, ' ').trim()
    }
  })
}

function setNodeSelection(nodeId: string) {
  // Clear any existing selections first
  clearAllSelections()

  // Add selected class to the clicked node
  const selectedNode = nodes.value.find(n => n.id === nodeId)
  if (selectedNode) {
    const currentClass = typeof selectedNode.class === 'string' ? selectedNode.class : ''
    selectedNode.class = `${currentClass} selected`.trim()
  }

  // Add highlighted class to connected edges
  edges.value.forEach(edge => {
    if (edge.source === nodeId || edge.target === nodeId) {
      const currentClass = typeof edge.class === 'string' ? edge.class : ''
      edge.class = `${currentClass} highlighted`.trim()
    }
  })
}

function handleNodeClick(event: any) {
  const node = event.node

  if (node.type === 'service' || node.type === 'external-service') {
    // If the same node is clicked again, unselect it
    if (selectedNodeId.value === node.id) {
      clearAllSelections()
      selectedItem.value = null
      selectedNodeId.value = null
      return
    }

    // Set the selection classes directly on the nodes/edges
    setNodeSelection(node.id)

    const serviceData = node.data?.service
    const connections = serviceData?.outgoingConnections?.map((conn: any) => ({
      target: conn.targetIdentifier,
      type: conn.connectionType
    })) || []

    selectedItem.value = {
      type: 'service',
      label: node.data?.label || node.id,
      isExternal: node.data?.isExternal || false,
      description: serviceData?.description,
      connections: connections,
      groupName: serviceData?.groupName
    }
    selectedNodeId.value = node.id
  } else if (node.type === 'group' || node.type === 'external-group') {
    clearAllSelections()
    selectedItem.value = {
      type: 'group',
      label: node.data?.label || node.id,
      isExternal: node.type === 'external-group',
      description: node.type === 'external-group' ? 'External dependency group' : 'Main group',
      groupName: node.data?.groupName
    }
    selectedNodeId.value = null
  } else {
    clearAllSelections()
    selectedItem.value = null
    selectedNodeId.value = null
  }
}

function clearSelection() {
  clearAllSelections()
  selectedItem.value = null
  selectedNodeId.value = null
}
</script>

<style scoped>
.page-container {
  position: relative;
  padding: 0;
  margin: 0;
  height: 100vh;
  overflow: hidden;
}

.back-button {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.content-with-sidebar {
  height: 100vh;
  display: flex;
}

.flow-canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
