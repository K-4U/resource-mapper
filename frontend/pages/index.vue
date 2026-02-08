<template>
  <div class="page-container">
    <LoadingSpinner v-if="pending" :message="loadingMessage" />

    <ErrorDisplay
      v-else-if="error"
      title="Error Loading Groups"
      message="Failed to load the group overview diagram."
      :technical-details="error"
      :check-list="[
        'Ensure the static data files are accessible under /public/services',
        'Check the browser console (F12) for more details'
      ]"
      :on-retry="refreshData"
    />

    <EmptyState
      v-else-if="!hasDiagramContent"
      icon="📦"
      title="No Groups Found"
      message="No group definitions were discovered under /public/services."
    />

    <div v-else class="layout">
      <FlowCanvas
        class="flow-canvas"
        :diagram="diagramDefinition"
        :pending="pending"
        :show-toolbar="true"
        group-name="All Groups"
        @node-click="handleNodeClick"
        @node-double-click="handleNodeDoubleClick"
      />
      <GroupDetailSidebar
        class="sidebar"
        :group-id="selectedGroupId"
        placeholder-message="Select a group to get more info"
        @clear-selection="clearSelection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from '#app'
import { useGroups } from '~/composables/useGroups'
import { useAllGroupConnections } from '~/composables/useAllGroupConnections'
import { buildGroupOverviewDiagram } from '~/utils/mermaid/groupDiagram'
import GroupDetailSidebar from '~/components/GroupDetailSidebar.vue'

const router = useRouter()
const diagramDefinition = ref('')
const nodeGroupMap = ref<Record<string, string>>({})
const selectedGroupId = ref<string | null>(null)

const {
  data: groupsData,
  pending: groupsPending,
  error: groupsError,
  refresh: refreshGroups
} = await useGroups()

const {
  data: groupConnections,
  pending: connectionsPending,
  error: connectionsError,
  refresh: refreshConnections
} = await useAllGroupConnections()

const pending = computed(() => groupsPending.value || connectionsPending.value)
const error = computed(() => groupsError.value || connectionsError.value)
const loadingMessage = computed(() => 'Loading group overview...')
const hasDiagramContent = computed(() => diagramDefinition.value.trim().length > 0)

watch(
  [groupsData, groupConnections],
  ([groups, connections]) => {
    if (!groups || !connections) {
      diagramDefinition.value = ''
      nodeGroupMap.value = {}
      selectedGroupId.value = null
      return
    }
    const { diagram, nodeToGroupMap } = buildGroupOverviewDiagram(groups, connections)
    diagramDefinition.value = diagram
    nodeGroupMap.value = nodeToGroupMap
  },
  { immediate: true }
)

function refreshData() {
  refreshGroups()
  refreshConnections()
}

function handleNodeClick(nodeId: string) {
  selectedGroupId.value = nodeGroupMap.value[nodeId] ?? null
}

function clearSelection() {
  selectedGroupId.value = null
}

function handleNodeDoubleClick(nodeId: string) {
  const groupId = nodeGroupMap.value[nodeId]
  if (!groupId) {
    return
  }
  router.push({ path: '/group', query: { groupId } })
}
</script>

<style scoped>
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f6f7fb;
  padding: 0;
}

.layout {
  display: flex;
  flex: 1;
  width: 100%;
  gap: 0;
}

.flow-canvas {
  flex: 1;
  height: 100%;
}

.sidebar {
  width: 320px;
  max-width: 35%;
  height: 100%;
}
</style>
