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
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :node-types="nodeTypes"
        class="vue-flow-container"
        fit-view-on-init
        :default-viewport="{ zoom: 1 }"
        :min-zoom="0.2"
        :max-zoom="4"
        :nodes-draggable="true"
        :elements-selectable="true"
        :auto-connect="false"
        :snap-to-grid="true"
        :apply-changes="true"
        :delete-key-code="null"
        :only-render-visible-nodes="true"
        :select-nodes-on-drag="false"
        :pan-on-drag="true"
        @error="handleError"
      >
        <Background pattern-color="#aaa" :gap="16" />
        <Controls>
        </Controls>
        <MiniMap position="bottom-left" />
      </VueFlow>

      <Legend type="group" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {useVueFlow, VueFlow, VueFlowError} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge } from '@vue-flow/core'
import GroupNodeVue from '~/components/flow/GroupNode.vue'
import ExternalGroupNode from '~/components/flow/ExternalGroupNode.vue'
import ServiceNodeVue from '~/components/flow/ServiceNode.vue'
import ExternalServiceNode from '~/components/flow/ExternalServiceNode.vue'
import { GroupNode } from '~/composables/useFlowNodes'
import type { ServiceDefinition, GroupInfo } from '~/generated/api/src'

const route = useRoute()
const router = useRouter()
const api = useApi()
const { onError } = useVueFlow();

const groupName = route.params.groupName as string
const capitalizedGroupName = computed(() =>
  groupName.charAt(0).toUpperCase() + groupName.slice(1).toLowerCase()
)

// Define custom node types
const nodeTypes = {
  'group': markRaw(GroupNodeVue),
  'external-group': markRaw(ExternalGroupNode),
  'service': markRaw(ServiceNodeVue),
  'external-service': markRaw(ExternalServiceNode)
}

onError(handleError);

function handleError(error:VueFlowError) {
  console.error('Vue Flow Error:', error);
}


const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const groupInfo = ref<GroupInfo | null>(null)

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

  // Add services to the main group
  services.forEach((service, index) => {
    const serviceNode = mainGroup.addService(service, index, 'service')
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
        animated: true
      })
    } else {
      // Internal connection
      edges.push({
        id: `${serviceId}-${targetId}`,
        source: serviceId,
        target: targetId,
        label: `Port ${connection.port}`,
        type: 'smoothstep'
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

    externalGroups.set(targetGroupName, externalGroup)
    console.log('Created external group:', externalGroup.id)
  }

  // Add service to external group if not already added
  if (!externalServiceMap.has(targetId)) {
    const group = externalGroups.get(targetGroupName)!
    const serviceIndex = group.getServices().length
    group.addService(targetService, serviceIndex, 'external-service')
    externalServiceMap.set(targetId, targetService)
  }
}

function refreshData() {
  refresh()
}


</script>

<style scoped>

</style>
