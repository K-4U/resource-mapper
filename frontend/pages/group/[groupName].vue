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
import {useVueFlow, VueFlowError} from '@vue-flow/core'
import type {Node, Edge} from '@vue-flow/core'
import {GroupNode} from '~/composables/useFlowNodes'
import type {ServiceDefinition, GroupInfo} from '~/generated/api/src'

const route = useRoute()
const router = useRouter()
const api = useApi()
const {onError} = useVueFlow()

const groupName = route.params.groupName as string
const capitalizedGroupName = computed(() =>
    groupName.charAt(0).toUpperCase() + groupName.slice(1).toLowerCase()
)

onError(handleError)

function handleError(error: VueFlowError) {
  console.error('Vue Flow Error:', error)
}

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const groupInfo = ref<GroupInfo | null>(null)
const edgeAnimationEnabled = ref(true)
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

      buildGraph(services, allServices)
      return {services, allServices, info}
    },
    {
      server: false
    }
)

function buildGraph(
    services: ServiceDefinition[],
    allServices: Record<string, ServiceDefinition[]>
) {
  const tempNodes: Node[] = []
  const tempEdges: Edge[] = []
  const externalGroups = new Map<string, GroupNode>()
  const externalServiceMap = new Map<string, ServiceDefinition>()

  const mainGroup = new GroupNode(
      groupName,
      capitalizedGroupName.value,
      100,
      100,
      false
  )

  mainGroup.registerServices(services)

  services.forEach((service, index) => {
    const serviceNode = mainGroup.addService(service, index, false)

    // Process outgoing connections
    processServiceConnections(
        service,
        serviceNode.id,
        groupName,
        allServices,
        externalGroups,
        externalServiceMap,
        tempEdges
    )

    // Process incoming connections (now directly from service data)
    processIncomingConnections(
        service,
        serviceNode.id,
        groupName,
        allServices,
        externalGroups,
        externalServiceMap,
        tempEdges
    )
  })

  tempNodes.push(...mainGroup.getAllNodes())

  externalGroups.forEach((group) => {
    tempNodes.push(...group.getAllNodes())
  })

  nodes.value = tempNodes
  edges.value = tempEdges
}

function processServiceConnections(
    service: ServiceDefinition,
    serviceId: string,
    currentGroupName: string,
    allServices: Record<string, ServiceDefinition[]>,
    externalGroups: Map<string, GroupNode>,
    externalServiceMap: Map<string, ServiceDefinition>,
    edges: Edge[]
) {
  if (!service.outgoingConnections) return

  service.outgoingConnections.forEach((connection) => {
    const targetId = connection.targetIdentifier
    const targetGroupName = targetId.split('/')[0] ?? ''

    if (targetGroupName !== currentGroupName) {
      handleExternalConnection(
          targetGroupName,
          targetId,
          allServices,
          externalGroups,
          externalServiceMap
      )

      edges.push({
        id: `${serviceId}-${targetId}`,
        source: serviceId,
        target: targetId,
        label: connection.connectionType,
        type: 'smoothstep',
        animated: true,
        class: 'external'
      })
    } else {
      edges.push({
        id: `${serviceId}-${targetId}`,
        source: serviceId,
        target: targetId,
        label: connection.connectionType,
        type: 'smoothstep',
        class: 'internal'
      })
    }
  })
}

function processIncomingConnections(
    service: ServiceDefinition,
    serviceId: string,
    currentGroupName: string,
    allServices: Record<string, ServiceDefinition[]>,
    externalGroups: Map<string, GroupNode>,
    externalServiceMap: Map<string, ServiceDefinition>,
    edges: Edge[]
) {
  if (!service.incomingConnections) return

  service.incomingConnections.forEach((incomingConnection) => {
    const sourceId = incomingConnection.targetIdentifier // In incoming connections, this is actually the source
    const sourceGroupName = sourceId.split('/')[0] ?? ''

    // If the incoming service is from a different group, add it as external
    if (sourceGroupName !== currentGroupName) {
      handleExternalConnection(
          sourceGroupName,
          sourceId,
          allServices,
          externalGroups,
          externalServiceMap
      )

      // Only add the edge if it doesn't already exist (to avoid duplicates from outgoing connections)
      const edgeId = `${sourceId}-${serviceId}`
      if (!edges.some(e => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: sourceId,
          target: serviceId,
          label: incomingConnection.connectionType,
          type: 'smoothstep',
          animated: true,
          class: 'incoming'
        })
      }
    }
    // Internal incoming connections are already handled by processServiceConnections
  })
}

function handleExternalConnection(
    targetGroupName: string,
    targetId: string,
    allServices: Record<string, ServiceDefinition[]>,
    externalGroups: Map<string, GroupNode>,
    externalServiceMap: Map<string, ServiceDefinition>
) {
  let targetService: ServiceDefinition | undefined
  if (allServices[targetGroupName]) {
    targetService = allServices[targetGroupName].find(
        s => `${s.groupName}/${s.identifier}` === targetId
    )
  }

  if (!targetService) return

  if (!externalGroups.has(targetGroupName)) {
    const capitalizedExtGroupName =
        targetGroupName.charAt(0).toUpperCase() + targetGroupName.slice(1).toLowerCase()

    const groupIndex = externalGroups.size
    const externalGroup = new GroupNode(
        targetGroupName,
        capitalizedExtGroupName,
        900,
        100 + groupIndex * 250,
        true
    )

    const externalGroupServices = allServices[targetGroupName] || []
    externalGroup.registerServices(externalGroupServices)

    externalGroups.set(targetGroupName, externalGroup)
  }

  if (!externalServiceMap.has(targetId)) {
    const group = externalGroups.get(targetGroupName)!
    const serviceIndex = group.getServices().length
    group.addService(targetService, serviceIndex, true)
    externalServiceMap.set(targetId, targetService)
  }
}

function refreshData() {
  refresh()
}

function setEdgeAnimation(enabled: boolean) {
  edgeAnimationEnabled.value = enabled
}

function onNodeDragStart() {
  setEdgeAnimation(false)
}

function onNodeDragStop() {
  setEdgeAnimation(true)
}

function clearAllSelections() {
  // Clear selected class from all nodes
  nodes.value.forEach(node => {
    if (node.class) {
      node.class = node.class.replace(/\s*selected\s*/g, ' ').trim()
    }
  })

  // Clear highlighted class from all edges
  edges.value.forEach(edge => {
    if (edge.class) {
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
    selectedNode.class = `${selectedNode.class || ''} selected`.trim()
  }

  // Add highlighted class to connected edges
  edges.value.forEach(edge => {
    if (edge.source === nodeId || edge.target === nodeId) {
      edge.class = `${edge.class || ''} highlighted`.trim()
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
