<template>
  <div class="group-page">
    <LoadingSpinner v-if="pending" :message="loadingMessage" />

    <ErrorDisplay
      v-else-if="error"
      title="Unable to load group"
      message="Something went wrong while loading the selected group."
      :technical-details="error"
      :check-list="[
        'Verify the group identifier in the address bar (e.g. ?groupId=api)',
        'Ensure the static data files are reachable under /public/services'
      ]"
      :on-retry="refreshData"
    />

    <ErrorDisplay
      v-else-if="!groupId"
      title="Missing group"
      message="Specify a groupId query parameter, e.g. /group?groupId=api."
      :on-retry="refreshData"
    />

    <EmptyState
      v-else-if="!groupInfo"
      icon="🤷"
      title="Unknown group"
      :message="`We could not find a group named '${groupId}'.`"
    />

    <div v-else class="group-layout">
      <FlowCanvas
         class="group-canvas"
        :diagram="diagramDefinition"
        :pending="pending"
        :show-toolbar="true"
        :group-name="groupInfo?.name || groupInfo?.groupName || groupId"
        @node-click="handleNodeClick"
        @node-double-click="handleNodeDoubleClick"
        @go-home="navigateHome"
      />
      <ServiceDetailSidebar
        :group="groupInfo"
        :service="selectedService"
        :service-group="selectedServiceGroup"
        @clear-service="clearServiceSelection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from '#app'
import { useGroups } from '~/composables/useGroups'
import { useExternalServicesForGroup, useServices } from '~/composables/useServices'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import ErrorDisplay from '~/components/ErrorDisplay.vue'
import EmptyState from '~/components/EmptyState.vue'
import FlowCanvas from '~/components/FlowCanvas.vue'
import ServiceDetailSidebar from '~/components/ServiceDetailSidebar.vue'
import { buildGroupServicesDiagram } from '~/utils/mermaid/groupServicesDiagram'
import { getServiceNodeIdFromDefinition } from '~/utils/mermaid/diagramHelpers'
import type { ExternalGroupServices, GroupInfo, ServiceDefinition } from '~/types'

const route = useRoute()
const router = useRouter()
const groupId = computed(() => {
  const value = route.query.groupId
  if (Array.isArray(value)) {
    return value[0] || ''
  }
  return typeof value === 'string' ? value : ''
})

const {
  data: groupsData,
  pending: groupsPending,
  error: groupsError,
  refresh: refreshGroups
} = await useGroups()

const {
  data: servicesData,
  pending: servicesPending,
  error: servicesError,
  refresh: refreshServices
} = await useServices(groupId)

const {
  data: externalServicesData,
  pending: externalPending,
  error: externalError,
  refresh: refreshExternal
} = await useExternalServicesForGroup(groupId)

const pending = computed(() => groupsPending.value || servicesPending.value || externalPending.value)
const error = computed(() => groupsError.value || servicesError.value || externalError.value)
const loadingMessage = computed(() => 'Loading group overview...')
const groupInfo = computed<GroupInfo | null>(() => {
  if (!groupId.value) {
    return null
  }
  return groupsData.value?.[groupId.value] ?? null
})
const services = computed<ServiceDefinition[]>(() => servicesData.value || [])
const selectedServiceId = ref<string | null>(null)
const selectedExternalService = ref<{ service: ServiceDefinition; group: GroupInfo } | null>(null)
const serviceNodeLookup = computed<Record<string, ServiceDefinition>>(() => {
  const map: Record<string, ServiceDefinition> = {}
  const currentGroupId = groupId.value
  if (!currentGroupId) {
    return map
  }
  services.value.forEach(service => {
    map[getServiceNodeIdFromDefinition(service)] = service
  })
  return map
})
const externalServiceDetailLookup = computed<Record<string, { service: ServiceDefinition; group: GroupInfo }>>(() => {
  const map: Record<string, { service: ServiceDefinition; group: GroupInfo }> = {}
  externalGroups.value.forEach(entry => {
    entry.services.forEach(service => {
      map[getServiceNodeIdFromDefinition(service)] = { service, group: entry.group }
    })
  })
  return map
})
const externalGroupNodeLookup = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  externalGroups.value.forEach(entry => {
    map[`${entry.direction}_${entry.group.groupName}`] = entry.group.groupName
  })
  return map
})
const selectedService = computed(() => {
  if (selectedServiceId.value) {
    return serviceNodeLookup.value[selectedServiceId.value] ?? null
  }
  return selectedExternalService.value?.service ?? null
})

const selectedServiceGroup = computed<GroupInfo | null>(() => {
  if (!selectedService.value) {
    return null
  }
  if (selectedServiceId.value) {
    return groupInfo.value ?? null
  }
  return selectedExternalService.value?.group ?? null
})

const externalGroups = computed<ExternalGroupServices[]>(() => externalServicesData.value || [])

const diagramDefinition = computed(() => {
  if (!groupInfo.value) {
    return ''
  }
  return buildGroupServicesDiagram(groupInfo.value, services.value, externalGroups.value)
})

function refreshData() {
  refreshGroups()
  refreshServices()
  refreshExternal()
}

function handleNodeClick(nodeId: string) {
  if (serviceNodeLookup.value[nodeId]) {
    selectedServiceId.value = nodeId
    selectedExternalService.value = null
    return
  }
  const external = externalServiceDetailLookup.value[nodeId]
  if (external) {
    selectedServiceId.value = null
    selectedExternalService.value = external
    return
  }
  selectedServiceId.value = null
  selectedExternalService.value = null
}

function handleNodeDoubleClick(nodeId: string) {
  const externalGroupId = externalServiceDetailLookup.value[nodeId]?.group.groupName || externalGroupNodeLookup.value[nodeId]
  if (!externalGroupId) {
    return
  }
  router.push({ path: '/group', query: { groupId: externalGroupId } })
}

function navigateHome() {
  router.push({ path: '/' })
}

function clearServiceSelection() {
  selectedServiceId.value = null
  selectedExternalService.value = null
}
</script>

<style scoped>
.group-page {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.group-layout {
  display: flex;
  flex: 1;
  width: 100%;
}

.group-canvas {
  flex: 1;
  height: 100%;
}
</style>
