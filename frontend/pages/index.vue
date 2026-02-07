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
      v-else-if="!hasDiagramContent"
      icon="📦"
      :title="currentMode === 'overview' ? 'No Groups Found' : 'No Services in This Group'"
      :message="currentMode === 'overview' ? 'The backend connected successfully, but no groups were found.' : `Group '${currentGroup}' exists but has no services defined.`"
      :action-label="currentMode === 'group' ? '← Back to Overview' : undefined"
      :on-action="currentMode === 'group' ? goHome : undefined"
    />

    <div v-else class="content-with-sidebar">
      <div class="flow-canvas-wrapper">
        <!-- Always render the FlowCanvas so overview view also shows Mermaid UML -->
        <FlowCanvas
          :diagram="diagramDefinition"
          :pending="pending"
          :show-toolbar="currentMode === 'group'"
          :can-go-back="canGoBack"
          :hide-incoming-connections="hideIncomingConnections"
          :hide-external-to-external="hideExternalToExternal"
          @node-click="handleMermaidNodeClick"
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
import { useGroupGraph, type DiagramBuildResult, type DiagramNodeMeta } from '~/composables/useGroupGraph'
import { resourceService } from '~/services/ResourceService'
import type { GroupInfo, ServiceDefinition } from '~/types'

const { buildGraphFromConnections, buildGraph } = useGroupGraph()

const route = useRoute()
const router = useRouter()

const currentMode = ref<'overview' | 'group'>('overview')
const currentGroup = ref('')
const selectedGroup = ref<string | null>(null)
const selectedItem = ref<any>(null)
const selectedNodeId = ref<string | null>(null)
const diagramDefinition = ref('')
const nodeMetadata = ref<Record<string, DiagramNodeMeta>>({})
const currentEdgeCount = ref(0)
const groupInfo = ref<GroupInfo | null>(null)
const lastGroupData = ref<{ services: ServiceDefinition[]; allServices: Record<string, ServiceDefinition[]> } | null>(null)
const navigationHistory = ref<string[]>([])
const hideIncomingConnections = ref(false)
const hideExternalToExternal = ref(false)
const lastClickInfo = ref<{ id: string | null; timestamp: number }>({ id: null, timestamp: 0 })

const canGoBack = computed(() => navigationHistory.value.length > 0 || currentMode.value === 'group')
const capitalizedGroupName = computed(() => currentGroup.value
  ? currentGroup.value.charAt(0).toUpperCase() + currentGroup.value.slice(1).toLowerCase()
  : '')
const loadingMessage = computed(() => currentMode.value === 'overview' ? 'Loading groups...' : 'Loading group details...')
const hasDiagramContent = computed(() => Object.keys(nodeMetadata.value).length > 0)
const serviceCount = computed(() => Object.values(nodeMetadata.value).filter(meta => meta.type === 'service').length)
const connectionCount = computed(() => currentEdgeCount.value)
const externalGroupCount = computed(() => Object.values(nodeMetadata.value).filter(meta => meta.type === 'external-group').length)

const { data: groupConnections, pending, error, refresh } = await useAsyncData(
  'group-connections',
  async () => {
    const connections = await resourceService.getAllGroupConnections()
    return connections
  },
  { server: false }
)

watch(groupConnections, (connections) => {
  if (connections && currentMode.value === 'overview' && !route.query.group) {
    applyDiagram(buildGraphFromConnections(connections, selectedNodeId.value))
  }
}, { immediate: true })

watch(() => route.query.group, async (groupName) => {
  if (groupName && typeof groupName === 'string') {
    if (currentGroup.value !== groupName) {
      await loadGroupServices(groupName, false, false)
    }
  } else if (currentMode.value === 'group') {
    goHome()
  }
}, { immediate: true })

onMounted(async () => {
  const groupParam = route.query.group
  if (groupParam && typeof groupParam === 'string' && currentGroup.value !== groupParam) {
    await loadGroupServices(groupParam, false, false)
  }
})

function applyDiagram(result: DiagramBuildResult) {
  diagramDefinition.value = result.definition
  nodeMetadata.value = result.nodeMeta
  currentEdgeCount.value = result.stats.edgeCount
  if (result.definition?.trim()) {
    console.info('[Mermaid UML]', '\n' + result.definition)
  }
}

function rebuildOverviewDiagram() {
  if (!groupConnections.value) return
  applyDiagram(buildGraphFromConnections(groupConnections.value, selectedNodeId.value))
}

function rebuildGroupDiagram() {
  if (!lastGroupData.value) return
  const { services, allServices } = lastGroupData.value
  const displayName = capitalizedGroupName.value || currentGroup.value
  applyDiagram(buildGraph(
    services,
    allServices,
    currentGroup.value,
    displayName,
    hideIncomingConnections.value,
    hideExternalToExternal.value,
    selectedNodeId.value
  ))
}

function rebuildCurrentDiagram() {
  if (currentMode.value === 'overview') {
    rebuildOverviewDiagram()
  } else {
    rebuildGroupDiagram()
  }
}

async function loadGroupData(groupName: string) {
  const allServices = await resourceService.getAllServices()
  const servicesWithIncoming = await resourceService.getServicesByGroupWithContext(groupName)
  const info = await resourceService.getGroupInfo(groupName).catch(() => null)
  groupInfo.value = info
  lastGroupData.value = { services: servicesWithIncoming, allServices }
  applyDiagram(buildGraph(
    servicesWithIncoming,
    allServices,
    groupName,
    groupName.charAt(0).toUpperCase() + groupName.slice(1).toLowerCase(),
    hideIncomingConnections.value,
    hideExternalToExternal.value,
    selectedNodeId.value
  ))
  return { services: servicesWithIncoming, allServices, info }
}

function goHome() {
  router.push('/')
  currentMode.value = 'overview'
  currentGroup.value = ''
  selectedGroup.value = null
  selectedItem.value = null
  selectedNodeId.value = null
  groupInfo.value = null
  lastGroupData.value = null
  navigationHistory.value = []
  rebuildOverviewDiagram()
}

function goBack() {
  if (currentMode.value === 'group') {
    goHome()
  } else if (navigationHistory.value.length > 0) {
    const previousGroup = navigationHistory.value.pop()!
    loadGroupServices(previousGroup, false)
  }
}

async function loadGroupServices(groupName: string, addToHistory = true, updateUrl = true) {
  if (addToHistory && currentMode.value === 'group' && currentGroup.value) {
    navigationHistory.value.push(currentGroup.value)
  }
  if (updateUrl && route.query.group !== groupName) {
    router.push(`/?group=${groupName}`)
  }
  currentMode.value = 'group'
  currentGroup.value = groupName
  selectedGroup.value = groupName
  selectedNodeId.value = null
  try {
    await loadGroupData(groupName)
  } catch (error) {
    console.error('Failed to load group services:', error)
  }
}

function handleMermaidNodeClick(nodeId: string) {
  const now = Date.now()
  if (lastClickInfo.value.id === nodeId && now - lastClickInfo.value.timestamp < 350) {
    handleNodeDoubleClick(nodeId)
  } else {
    handleNodeClick(nodeId)
  }
  lastClickInfo.value = { id: nodeId, timestamp: now }
}

function handleNodeClick(nodeId: string) {
  const meta = nodeMetadata.value[nodeId]
  if (!meta) {
    return
  }

  if (currentMode.value === 'overview') {
    selectedGroup.value = meta.groupName
    selectedItem.value = {
      type: 'group',
      label: meta.label,
      isExternal: false,
      description: 'Group overview',
      groupName: meta.groupName
    }
    selectedNodeId.value = nodeId
    loadGroupInfo(meta.groupName)
    rebuildOverviewDiagram()
    return
  }

  if (meta.type === 'service' || meta.type === 'external-service') {
    if (selectedNodeId.value === nodeId) {
      clearSelection()
      rebuildGroupDiagram()
      return
    }
    selectedNodeId.value = nodeId
    const service = meta.service
    const connections = service?.outgoingConnections?.map(conn => ({
      target: conn.targetIdentifier,
      type: conn.connectionType
    })) || []
    selectedItem.value = {
      type: 'service',
      label: meta.label,
      isExternal: meta.type === 'external-service',
      description: service?.description,
      connections,
      groupName: service?.groupName
    }
    rebuildGroupDiagram()
    return
  }

  selectedNodeId.value = nodeId
  selectedItem.value = {
    type: 'group',
    label: meta.label,
    isExternal: meta.type === 'external-group',
    description: meta.type === 'external-group' ? 'External dependency group' : 'Main group',
    groupName: meta.groupName
  }
  if (currentMode.value === 'overview') {
    selectedGroup.value = meta.groupName
    loadGroupInfo(meta.groupName)
  }
  rebuildCurrentDiagram()
}

function handleNodeDoubleClick(nodeId: string) {
  const meta = nodeMetadata.value[nodeId]
  if (!meta) {
    return
  }
  if (currentMode.value === 'overview') {
    loadGroupServices(meta.groupName, true)
    return
  }
  if (meta.type === 'external-service') {
    const targetGroup = meta.service?.groupName
    if (targetGroup && targetGroup !== currentGroup.value) {
      loadGroupServices(targetGroup, true)
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

function clearSelection() {
  selectedItem.value = null
  selectedNodeId.value = null
  if (currentMode.value === 'overview') {
    selectedGroup.value = null
    groupInfo.value = null
  }
}

function toggleIncomingConnections() {
  hideIncomingConnections.value = !hideIncomingConnections.value
  if (currentMode.value === 'group') {
    rebuildGroupDiagram()
  }
}

function toggleExternalToExternal() {
  hideExternalToExternal.value = !hideExternalToExternal.value
  if (currentMode.value === 'group') {
    rebuildGroupDiagram()
  }
}

function refreshData() {
  if (currentMode.value === 'overview') {
    refresh()
  } else if (currentGroup.value) {
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
</style>
