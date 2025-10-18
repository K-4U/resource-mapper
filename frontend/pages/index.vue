<template>
  <div>
    <header class="app-header">
      <div class="header-content">
        <div>
          <div class="header-title">Resource Mapper</div>
          <div class="header-subtitle">Service Dependencies Overview</div>
        </div>
      </div>
    </header>

    <LoadingSpinner v-if="pending" message="Loading services..." />

    <ErrorDisplay
      v-else-if="error"
      title="Error Loading Data"
      message="Failed to connect to the backend API."
      :technical-details="error"
      :check-list="[
        'Is the Spring Boot backend running on http://localhost:8080?',
        'Is CORS properly configured?',
        'Check the browser console (F12) for more details'
      ]"
      :on-retry="refreshData"
    />

    <EmptyState
      v-else-if="!nodes || nodes.length === 0"
      icon="📦"
      title="No Services Found"
      message="The backend connected successfully, but no service definitions were found."
    />

    <div v-else style="position: relative;">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :node-types="nodeTypes"
        class="vue-flow-container"
        @node-click="onNodeClick"
        fit-view-on-init
      >
        <Background pattern-color="#aaa" :gap="16" />
        <Controls />
        <MiniMap />
      </VueFlow>

      <Legend type="index" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge } from '@vue-flow/core'
import GroupNodeItem from '~/components/flow/GroupNodeItem.vue'

const api = useApi()
const router = useRouter()

// Define custom node types
const nodeTypes = {
  'group-node': markRaw(GroupNodeItem)
}

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

// Fetch data with client-side only rendering
const { data: allServices, pending, error, refresh } = await useAsyncData(
  'all-services',
  async () => {
    console.log('Fetching data from API...')
    const [services, groupsInfo] = await Promise.all([
      api.getAllServices(),
      api.getAllGroupInfo()
    ])
    console.log('Data loaded successfully:', { services, groupsInfo })
    return { services, groupsInfo }
  },
  {
    server: false // Client-side only to avoid SSR issues
  }
)

// Build graph when data is loaded
watch(allServices, (data) => {
  if (data) {
    console.log('Building graph with data:', data)
    buildGraph(data.services, data.groupsInfo)
  }
}, { immediate: true })

function buildGraph(services: Record<string, any[]>, groupsInfo: Record<string, any>) {
  const tempNodes: Node[] = []
  const tempEdges: Edge[] = []
  const groupConnections = new Map<string, Set<string>>()

  // Process all services to find inter-group connections
  Object.entries(services).forEach(([groupName, groupServices]) => {
    groupServices.forEach((service) => {
      if (service.outgoingConnections) {
        service.outgoingConnections.forEach((connection: any) => {
          const targetGroup = connection.targetIdentifier.split('/')[0]
          if (targetGroup !== groupName) {
            if (!groupConnections.has(groupName)) {
              groupConnections.set(groupName, new Set())
            }
            groupConnections.get(groupName)!.add(targetGroup)
          }
        })
      }
    })
  })

  // Create nodes for each group
  const groupNames = Object.keys(services)
  const cols = Math.ceil(Math.sqrt(groupNames.length))

  groupNames.forEach((groupName, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols

    const capitalizedName = groupName.charAt(0).toUpperCase() + groupName.slice(1).toLowerCase()

    tempNodes.push({
      id: groupName,
      type: 'group-node',
      position: { x: col * 250, y: row * 150 },
      data: { label: capitalizedName }
    })
  })

  // Create edges between groups
  groupConnections.forEach((targets, source) => {
    targets.forEach((target) => {
      tempEdges.push({
        id: `${source}-${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: true
      })
    })
  })

  nodes.value = tempNodes
  edges.value = tempEdges
  console.log('Graph built:', { nodeCount: tempNodes.length, edgeCount: tempEdges.length })
}

function onNodeClick(event: any) {
  const nodeId = event.node.id
  router.push(`/group/${nodeId}`)
}

function refreshData() {
  console.log('Refreshing data...')
  refresh()
}
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
