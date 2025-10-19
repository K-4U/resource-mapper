<template>
  <div>
    <header class="app-header">
      <div class="header-content">
        <div>
          <div class="header-title">
            <button
              @click="router.push('/')"
              style="background: transparent; border: none; color: white; cursor: pointer; font-size: 20px; margin-right: 10px; padding: 8px;"
            >
              ← Back
            </button>
            {{ capitalizedGroupName }}
          </div>
          <div class="header-subtitle" v-if="groupInfo?.description">
            {{ groupInfo.description }}
          </div>
        </div>
      </div>
    </header>

    <LoadingSpinner v-if="pending" message="Loading group details..." />

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

    <div v-else style="position: relative;">
      <FlowCanvas
        :nodes="nodes"
        :edges="renderedEdges"
        legend-type="group"
        @error="handleError"
        @node-drag-start="onNodeDragStart"
        @node-drag-stop="onNodeDragStop"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVueFlow, VueFlowError } from '@vue-flow/core'
import type { Node, Edge } from '@vue-flow/core'
import { GroupNode } from '~/composables/useFlowNodes'
import type { ServiceDefinition, GroupInfo } from '~/generated/api/src'

const route = useRoute()
const router = useRouter()
const api = useApi()
const { onError } = useVueFlow()

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
const renderedEdges = computed(() => {
  if (edgeAnimationEnabled.value) return edges.value
  return edges.value.map(e => e.animated ? { ...e, animated: false } : e)
})

// Fetch data with error handling
const { pending, error, refresh } = await useAsyncData(
  `group-${groupName}`,
  async () => {
    console.log(`Fetching data for group: ${groupName}`)
    const [services, allServices, info] = await Promise.all([
      api.getServicesByGroup(groupName),
      api.getAllServices(),
      api.getGroupInfo(groupName).catch(() => null)
    ])

    console.log(`Data loaded for group ${groupName}:`, { services, allServices, info })
    groupInfo.value = info
    buildGraph(services, allServices)
    return { services, allServices, info }
  },
  {
    server: false // Client-side only
  }
)

function buildGraph(services: ServiceDefinition[], allServices: Record<string, ServiceDefinition[]>) {
  const tempNodes: Node[] = []
  const tempEdges: Edge[] = []
  const externalGroups = new Map<string, GroupNode>()
  const externalServiceMap = new Map<string, ServiceDefinition>()

  console.log('Building graph for group:', groupName)
  console.log('Services:', services)

  // Create main group with OOP approach
  const mainGroup = new GroupNode(
    groupName,
    capitalizedGroupName.value,
    100,
    100,
    false // not external
  )

  console.log('Created main group:', mainGroup.id)

  // Register all services first for intelligent positioning
  mainGroup.registerServices(services)

  // Add services to the main group
  services.forEach((service, index) => {
    const serviceNode = mainGroup.addService(service, index, false)
    console.log('Added service:', serviceNode.id)

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
  })

  // Add all nodes from main group
  tempNodes.push(...mainGroup.getAllNodes())

  // Add all external groups and their services
  externalGroups.forEach((group) => {
    tempNodes.push(...group.getAllNodes())
  })

  nodes.value = tempNodes
  edges.value = tempEdges
  console.log('Final node count:', tempNodes.length)
  console.log('Groups:', externalGroups.size + 1, 'Services:', services.length + externalServiceMap.size)
}

/**
 * Process connections for a service and create edges
 */
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
      // External connection
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
        label: `Port ${connection.port}`,
        type: 'smoothstep',
        animated: true,
        class: 'external'
      })
    } else {
      // Internal connection
      edges.push({
        id: `${serviceId}-${targetId}`,
        source: serviceId,
        target: targetId,
        label: `Port ${connection.port}`,
        type: 'smoothstep',
        class: 'internal'
      })
    }
  })
}

/**
 * Handle external connection - create external group if needed and add service
 */
function handleExternalConnection(
  targetGroupName: string,
  targetId: string,
  allServices: Record<string, ServiceDefinition[]>,
  externalGroups: Map<string, GroupNode>,
  externalServiceMap: Map<string, ServiceDefinition>
) {
  // Find target service info
  let targetService: ServiceDefinition | undefined
  if (allServices[targetGroupName]) {
    targetService = allServices[targetGroupName].find(
      s => `${s.groupName}/${s.identifier}` === targetId
    )
  }

  if (!targetService) return

  // Create external group if it doesn't exist
  if (!externalGroups.has(targetGroupName)) {
    const capitalizedExtGroupName =
      targetGroupName.charAt(0).toUpperCase() + targetGroupName.slice(1).toLowerCase()

    const groupIndex = externalGroups.size
    const externalGroup = new GroupNode(
      targetGroupName,
      capitalizedExtGroupName,
      900,
      100 + groupIndex * 250,
      true // is external
    )

    // Register all services from this external group for intelligent positioning
    const externalGroupServices = allServices[targetGroupName] || []
    externalGroup.registerServices(externalGroupServices)

    externalGroups.set(targetGroupName, externalGroup)
    console.log('Created external group:', externalGroup.id)
  }

  // Add service to external group if not already added
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

function setEdgeAnimation(enabled: boolean) { edgeAnimationEnabled.value = enabled }
function onNodeDragStart() {
  setEdgeAnimation(false)
}
function onNodeDragStop() {
  setEdgeAnimation(true)
}
</script>

<style scoped>

</style>
