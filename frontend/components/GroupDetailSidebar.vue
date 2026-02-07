<template>
  <aside class="sidebar">
    <q-scroll-area class="fit">
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>
          <div class="text-subtitle1">Details</div>
        </q-toolbar-title>
        <q-btn flat dense round icon="close" @click="$emit('clear-selection')" />
      </q-toolbar>

      <q-card flat bordered class="q-ma-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">{{ groupTitle }}</div>
          <div v-if="groupInfo?.description" class="text-caption text-grey-7">
            {{ groupInfo.description }}
          </div>
          <div v-else-if="serviceId" class="text-caption text-grey-7">
            Service: {{ serviceId }}
          </div>
        </q-card-section>

        <q-separator />

        <q-list dense>
          <q-item>
            <q-item-section avatar>
              <q-icon name="badge" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Group ID</q-item-label>
              <q-item-label caption>{{ groupId ?? '—' }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="teamInfo">
            <q-item-section avatar>
              <q-icon name="group" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Team</q-item-label>
              <q-item-label caption>{{ teamInfo.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-scroll-area>
  </aside>
</template>

<script setup lang="ts">
import { useGroups } from '~/composables/useGroups'
import { useTeams } from '~/composables/useTeams'

interface Props {
  groupId?: string | null
  serviceId?: string | null
}

const props = defineProps<Props>()

defineEmits<{
  'clear-selection': []
}>()

const { data: groupsData } = await useGroups()
const { data: teamsData } = await useTeams()

const groupInfo = computed(() => {
  if (!props.groupId) return null
  return groupsData.value?.[props.groupId] ?? null
})

const teamInfo = computed(() => {
  const teamId = groupInfo.value?.teamId
  if (!teamId) return null
  return teamsData.value?.[teamId] ?? null
})

const groupTitle = computed(() => {
  if (groupInfo.value?.name) {
    return groupInfo.value.name
  }
  if (props.groupId) {
    return props.groupId
  }
  if (props.serviceId) {
    return props.serviceId
  }
  return 'Selection'
})
</script>

<style scoped>
.sidebar {
  width: 320px;
  height: 100%;
  background-color: #f5f5f5;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
