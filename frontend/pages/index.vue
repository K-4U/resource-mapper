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
        :show-toolbar="false"
        @node-click="handleNodeClick"
      />
      <GroupDetailSidebar
        v-if="selectedGroupId"
        class="sidebar"
        :group-id="selectedGroupId"
        @clear-selection="clearSelection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGroups } from '~/composables/useGroups'
import { buildGroupOverviewDiagram } from '~/utils/mermaid/groupDiagram'
import GroupDetailSidebar from '~/components/GroupDetailSidebar.vue'

const diagramDefinition = ref('')
const nodeGroupMap = ref<Record<string, string>>({})
const selectedGroupId = ref<string | null>(null)

const {
  data: groupsData,
  pending: groupsPending,
  error: groupsError,
  refresh: refreshGroups
} = await useGroups()

const pending = computed(() => groupsPending.value)
const error = computed(() => groupsError.value)
const loadingMessage = computed(() => 'Loading group overview...')
const hasDiagramContent = computed(() => diagramDefinition.value.trim().length > 0)

watch(
  groupsData,
  groups => {
    if (!groups) {
      diagramDefinition.value = ''
      nodeGroupMap.value = {}
      selectedGroupId.value = null
      return
    }
    const { diagram, nodeToGroupMap } = buildGroupOverviewDiagram(groups)
    diagramDefinition.value = diagram
    nodeGroupMap.value = nodeToGroupMap
  },
  { immediate: true }
)

function refreshData() {
  refreshGroups()
}

function handleNodeClick(nodeId: string) {
  selectedGroupId.value = nodeGroupMap.value[nodeId] ?? null
}

function clearSelection() {
  selectedGroupId.value = null
}
</script>

<style scoped>
.page-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f6f7fb;
  padding: 1rem;
}

.layout {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 1rem;
}

.flow-canvas {
  flex: 1;
  height: 100%;
}

.sidebar {
  width: 320px;
  max-width: 35%;
}
</style>
