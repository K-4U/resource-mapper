<template>
  <div>
    <q-toolbar class="app-header">
      <q-toolbar-title>
        <div class="text-h5">Resource Mapper</div>
        <div class="text-caption">Service Dependencies Overview</div>
      </q-toolbar-title>
    </q-toolbar>

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
      <FlowCanvas
        :nodes="nodes"
        :edges="edges"
        legend-type="index"
        @node-click="onNodeClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Node, Edge } from '@vue-flow/core'

const api = useApi()
const router = useRouter()
const { buildGraphFromConnections } = useGroupGraph()

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

// Fetch group connections using the new endpoint
const { data: groupConnections, pending, error, refresh } = await useAsyncData(
  'group-connections',
  async () => {
    console.log('Fetching group connections from API...')
    const connections = await api.getAllGroupConnections()
    console.log('Group connections loaded:', connections)
    return connections
  },
  {
    server: false // Client-side only to avoid SSR issues
  }
)

// Build graph when data is loaded
watch(groupConnections, (connections) => {
  if (connections) {
    console.log('Building graph with connections:', connections)
    const { nodes: graphNodes, edges: graphEdges } = buildGraphFromConnections(connections)
    nodes.value = graphNodes
    edges.value = graphEdges
  }
}, { immediate: true })

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
.app-header {
  background: linear-gradient(135deg, var(--q-primary) 0%, #1565C0 100%);
  color: white;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
