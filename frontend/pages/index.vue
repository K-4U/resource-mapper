<template>
  <div class="page-container">
    <LoadingSpinner v-if="pending" :message="loadingMessage" />

    <ErrorDisplay
      v-else-if="error"
      :title="currentMode === 'overview' ? 'Error Loading Data' : 'Error Loading Group'"
      :message="currentMode === 'overview' ? 'Failed to connect to the backend API.' : `Failed to load services for group: ${currentGroup}`"
      :technical-details="error"
      :check-list="[
        'Is the Spring Boot backend running on http://localhost:8080?',
        currentMode === 'group' ? 'Does this group exist?' : 'Is CORS properly configured?',
        'Check the browser console (F12) for more details'
      ]"
      :on-retry="refreshData"
    />

    <EmptyState
      v-else-if="!nodes || nodes.length === 0"
      icon="📦"
      :title="currentMode === 'overview' ? 'No Groups Found' : 'No Services in This Group'"
      :message="currentMode === 'overview' ? 'The backend connected successfully, but no groups were found.' : `Group '${currentGroup}' exists but has no services defined.`"
      :action-label="currentMode === 'group' ? '← Back to Overview' : undefined"
      :on-action="currentMode === 'group' ? goHome : undefined"
    />

    <div v-else class="content-with-sidebar">
      <div class="flow-canvas-wrapper">
        <FlowCanvas
          :nodes="nodes"
          :edges="edges"
          :class="connectionVisibilityClasses"
          :show-toolbar="currentMode === 'group'"
          :can-go-back="canGoBack"
          :hide-incoming-connections="hideIncomingConnections"
          :hide-external-to-external="hideExternalToExternal"
          @node-click="handleNodeClick"
          @node-double-click="handleNodeDoubleClick"
          @go-home="goHome"
          @go-back="goBack"
          @toggle-incoming-connections="toggleIncomingConnections"
          @toggle-external-to-external="toggleExternalToExternal"
        />
      </div>

      <GroupDetailSidebar
        v-if="selectedGroup || selectedItem"
        :group-name="selectedGroup ? capitalizedGroupName : ''"
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
import type { Node, Edge } from '@vue-flow/core'
import { useGroupGraph } from '~/composables/useGroupGraph'
import { resourceService } from '~/services/ResourceService'
import type { GroupInfo, ServiceDefinition } from '~/types'
const { buildGraphFromConnections, buildGraph } = useGroupGraph()

const route = useRoute()
const router = useRouter()

// App state
const currentMode = ref<'overview' | 'group'>('overview')
const currentGroup = ref<string>('')
const selectedGroup = ref<string | null>(null)
const selectedItem = ref<any>(null)
const selectedNodeId = ref<string | null>(null)

// Data
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const groupInfo = ref<GroupInfo | null>(null)
const allServicesCache = ref<Record<string, ServiceDefinition[]>>({})

// Navigation
const navigationHistory = ref<string[]>([])
const canGoBack = computed(() => navigationHistory.value.length > 0 || currentMode.value === 'group')

// Connection visibility toggles
const hideIncomingConnections = ref(false)
const hideExternalToExternal = ref(false)

// Computed properties
const capitalizedGroupName = computed(() =>
  currentGroup.value.charAt(0).toUpperCase() + currentGroup.value.slice(1).toLowerCase()
)

const loadingMessage = computed(() => 
  currentMode.value === 'overview' ? 'Loading groups...' : 'Loading group details...'
)

const connectionVisibilityClasses = computed(() => ({
  'hide-incoming-connections': hideIncomingConnections.value,
  'hide-external-to-external': hideExternalToExternal.value
}))

const serviceCount = computed(() => 
  nodes.value.filter(n => n.type === 'service').length
)

const connectionCount = computed(() => edges.value.length)

const externalGroupCount = computed(() => 
  nodes.value.filter(n => n.type === 'external-group').length
)

// Initial data loading - start in overview mode
const { data: groupConnections, pending, error, refresh } = await useAsyncData(
  'group-connections',
  async () => {
    console.log('Fetching group connections from API...')
    const connections = await resourceService.getAllGroupConnections()
    console.log('Group connections loaded:', connections)
    return connections
  },
  {
    server: false // Client-side only to avoid SSR issues
  }
)

// Build graph when data is loaded (only if in overview mode and no group in route)
watch(groupConnections, (connections) => {
  if (connections && currentMode.value === 'overview' && !route.query.group) {
    console.log('Building overview graph with connections:', connections)
    const { nodes: graphNodes, edges: graphEdges } = buildGraphFromConnections(connections)
    nodes.value = graphNodes
    edges.value = graphEdges
  }
}, { immediate: true })

// Handle route changes - load group if group parameter is present
watch(() => route.query.group, async (groupName, oldGroupName) => {
  if (groupName && typeof groupName === 'string') {
    if (currentGroup.value !== groupName) {
      console.log(`Route changed to group: ${groupName}`)
      await loadGroupServices(groupName, false, false) // Don't update URL, we're already there
    }
  } else if (currentMode.value === 'group' && !groupName) {
    goHome()
  }
}, { immediate: true })

// Ensure route is checked on mount (backup for initial load)
onMounted(async () => {
  const groupParam = route.query.group
  if (groupParam && typeof groupParam === 'string' && currentGroup.value !== groupParam) {
    console.log(`Initial mount: loading group from route: ${groupParam}`)
    await loadGroupServices(groupParam, false, false)
  }
})

// Load group details (services)
async function loadGroupData(groupName: string) {
  console.log(`Loading group data for: ${groupName}`)
  
  try {
    // Get all services first and cache them
    const allServices = await resourceService.getAllServices()
    allServicesCache.value = allServices
    
    // Get services for current group
    const servicesWithIncoming = await resourceService.getServicesByGroupWithContext(groupName)
    
    // Get group info
    const info = await resourceService.getGroupInfo(groupName).catch(() => null)
    groupInfo.value = info

    console.log(`Data loaded for group ${groupName}:`, { services: servicesWithIncoming, allServices, info })
    
    const capitalizedName = groupName.charAt(0).toUpperCase() + groupName.slice(1).toLowerCase()
    const { nodes: graphNodes, edges: graphEdges } = buildGraph(
      servicesWithIncoming,
      allServices,
      groupName,
      capitalizedName,
      hideIncomingConnections.value,
      hideExternalToExternal.value
    )

    nodes.value = graphNodes
    edges.value = graphEdges
    
    return { services: servicesWithIncoming, allServices, info }
  } catch (err) {
    console.error('Failed to load group data:', err)
    throw err
  }
}

// Navigation functions
function goHome() {
  console.log('Going home - switching to overview mode')
  router.push('/')
  currentMode.value = 'overview'
  currentGroup.value = ''
  selectedGroup.value = null
  selectedItem.value = null
  selectedNodeId.value = null
  groupInfo.value = null
  navigationHistory.value = []
  
  // Reload overview data
  if (groupConnections.value) {
    const { nodes: graphNodes, edges: graphEdges } = buildGraphFromConnections(groupConnections.value)
    nodes.value = graphNodes
    edges.value = graphEdges
  }
}

function goBack() {
  if (currentMode.value === 'group') {
    goHome()
  } else if (navigationHistory.value.length > 0) {
    const previousGroup = navigationHistory.value.pop()!
    loadGroupServices(previousGroup, false)
  }
}

// Load group services (double-click behavior)
async function loadGroupServices(groupName: string, addToHistory: boolean = true, updateUrl: boolean = true) {
  console.log(`Loading services for group: ${groupName}`)
  
  if (addToHistory && currentMode.value === 'group' && currentGroup.value) {
    navigationHistory.value.push(currentGroup.value)
  }
  
  // Update URL only if requested (not when called from route watch)
  if (updateUrl && route.query.group !== groupName) {
    router.push(`/?group=${groupName}`)
  }
  
  // Set mode and group immediately
  currentMode.value = 'group'
  currentGroup.value = groupName
  selectedGroup.value = groupName
  
  try {
    await loadGroupData(groupName)
  } catch (err) {
    console.error('Failed to load group services:', err)
    // Stay in current mode but show error
  }
}

// Event handlers
function handleNodeClick(event: any) {
  const node = event.node
  console.log('Node clicked:', node.id, 'Mode:', currentMode.value)
  
  if (currentMode.value === 'overview') {
    // Overview mode: single click shows group info in sidebar
    selectedGroup.value = node.id
    selectedItem.value = {
      type: 'group',
      label: node.data?.label || node.id,
      isExternal: false,
      description: node.data?.description || 'Group overview',
      groupName: node.id
    }
    
    // Load group info for sidebar
    loadGroupInfo(node.id)
  } else {
    // Group mode: handle service/node selection like in original group page
    handleServiceSelection(node)
  }
}

function handleNodeDoubleClick(event: any) {
  const node = event.node
  console.log('Node double-clicked:', node.id, 'Mode:', currentMode.value)
  
  if (currentMode.value === 'overview') {
    // Overview mode: double click loads group services
    loadGroupServices(node.id, true)
  } else {
    // Group mode: double click on external services to switch groups
    if (node.type === 'service' && node.data?.isExternal) {
      const serviceData = node.data?.service
      const targetGroupName = serviceData?.groupName
      
      if (targetGroupName && targetGroupName !== currentGroup.value) {
        console.log(`Double-clicked external service: ${node.id}, switching to group: ${targetGroupName}`)
        loadGroupServices(targetGroupName, true)
      }
    }
  }
}

async function loadGroupInfo(groupName: string) {
  try {
    const info = await resourceService.getGroupInfo(groupName)
    if (selectedGroup.value === groupName) {
      groupInfo.value = info
    }
  } catch (err) {
    console.error('Failed to load group info:', err)
    groupInfo.value = null
  }
}

function handleServiceSelection(node: any) {
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

function clearSelection() {
  clearAllSelections()
  selectedItem.value = null
  selectedNodeId.value = null
  if (currentMode.value === 'overview') {
    selectedGroup.value = null
    groupInfo.value = null
  }
}

function toggleIncomingConnections() {
  hideIncomingConnections.value = !hideIncomingConnections.value
}

function toggleExternalToExternal() {
  hideExternalToExternal.value = !hideExternalToExternal.value
}

function refreshData() {
  console.log('Refreshing data...')
  if (currentMode.value === 'overview') {
    refresh()
  } else {
    loadGroupData(currentGroup.value)
  }
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

.content-with-sidebar {
  height: 100vh;
  display: flex;
}

.flow-canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Connection visibility CSS classes */
:deep(.hide-incoming-connections .vue-flow__edge.incoming-connection) {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.3s ease;
}

:deep(.hide-incoming-connections .vue-flow__node.incoming-only-service) {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.3s ease;
}

:deep(.hide-incoming-connections .vue-flow__node.empty-external-group) {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.3s ease;
}

:deep(.hide-incoming-connections .vue-flow__edge.incoming-only-connection) {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.3s ease;
}

:deep(.hide-external-to-external .vue-flow__edge.external-to-external) {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.3s ease;
}
</style>
