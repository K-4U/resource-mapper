<template>
  <aside class="sidebar">
    <q-scroll-area class="fit">
      <!-- Header -->
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>
          <div class="text-subtitle1">Details</div>
        </q-toolbar-title>
      </q-toolbar>

      <!-- Main group info -->
      <q-card flat bordered class="q-ma-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">{{ groupName }}</div>
          <div v-if="groupDescription" class="text-caption text-grey-7">
            {{ groupDescription }}
          </div>
        </q-card-section>

        <q-separator />

        <q-list dense>
          <q-item>
            <q-item-section avatar>
              <q-icon name="storage" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Services</q-item-label>
              <q-item-label caption>{{ serviceCount }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="link" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Connections</q-item-label>
              <q-item-label caption>{{ connectionCount }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="externalGroupCount > 0">
            <q-item-section avatar>
              <q-icon name="cloud" color="warning" />
            </q-item-section>
            <q-item-section>
              <q-item-label>External Groups</q-item-label>
              <q-item-label caption>{{ externalGroupCount }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Team Information Card -->
      <q-card v-if="teamInfo" flat bordered class="q-ma-md">
        <q-card-section class="bg-indigo-1">
          <div class="text-subtitle2 text-indigo-9 q-mb-xs">
            <q-icon name="group" class="q-mr-sm" />
            Team Information
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-weight-bold q-mb-sm">{{ teamInfo.name }}</div>
          <div v-if="teamInfo.description" class="text-caption text-grey-7 q-mb-md">
            {{ teamInfo.description }}
          </div>

          <q-list dense>
            <q-item v-if="teamInfo.teamLead" class="q-px-none">
              <q-item-section avatar class="min-width-auto">
                <q-icon name="person" size="xs" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Team Lead</q-item-label>
                <q-item-label>{{ teamInfo.teamLead }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="teamInfo.email" class="q-px-none">
              <q-item-section avatar class="min-width-auto">
                <q-icon name="email" size="xs" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Email</q-item-label>
                <q-item-label>
                  <a :href="`mailto:${teamInfo.email}`" class="text-primary">
                    {{ teamInfo.email }}
                  </a>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="teamInfo.slackChannel" class="q-px-none">
              <q-item-section avatar class="min-width-auto">
                <q-icon name="chat" size="xs" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Slack</q-item-label>
                <q-item-label>{{ teamInfo.slackChannel }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="teamInfo.oncallPhone" class="q-px-none">
              <q-item-section avatar class="min-width-auto">
                <q-icon name="phone" size="xs" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>On-Call</q-item-label>
                <q-item-label>{{ teamInfo.oncallPhone }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Loading state for team info -->
      <q-card v-else-if="loadingTeam" flat bordered class="q-ma-md">
        <q-card-section>
          <q-skeleton type="text" />
          <q-skeleton type="text" width="60%" />
        </q-card-section>
      </q-card>

      <!-- Selected item info -->
      <q-card v-if="selectedItem" flat bordered class="q-ma-md">
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">
            <q-icon
              :name="selectedItem.type === 'group' ? 'folder' : 'storage'"
              :color="selectedItem.isExternal ? 'warning' : 'primary'"
              class="q-mr-sm"
            />
            Selected: {{ selectedItem.label }}
          </div>
          <q-badge
            :color="selectedItem.isExternal ? 'warning' : 'primary'"
            :label="selectedItem.isExternal ? 'External' : 'Internal'"
          />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedItem.description">
          <div class="text-caption text-grey-7">{{ selectedItem.description }}</div>
        </q-card-section>

        <!-- Team info for selected item -->
        <q-card-section v-if="selectedTeamInfo" class="bg-indigo-1">
          <div class="text-caption text-indigo-9 q-mb-xs">
            <q-icon name="group" size="xs" class="q-mr-xs" />
            Managed by {{ selectedTeamInfo.name }}
          </div>
          <q-list dense class="q-mt-sm">
            <q-item v-if="selectedTeamInfo.teamLead" dense class="q-px-none q-py-xs">
              <q-item-section avatar class="min-width-auto q-pr-xs">
                <q-icon name="person" size="xs" color="indigo-9" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption class="text-indigo-9">{{ selectedTeamInfo.teamLead }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="selectedTeamInfo.email" dense class="q-px-none q-py-xs">
              <q-item-section avatar class="min-width-auto q-pr-xs">
                <q-icon name="email" size="xs" color="indigo-9" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>
                  <a :href="`mailto:${selectedTeamInfo.email}`" class="text-indigo-9">
                    {{ selectedTeamInfo.email }}
                  </a>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="selectedTeamInfo.slackChannel" dense class="q-px-none q-py-xs">
              <q-item-section avatar class="min-width-auto q-pr-xs">
                <q-icon name="chat" size="xs" color="indigo-9" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption class="text-indigo-9">{{ selectedTeamInfo.slackChannel }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <!-- Loading state for selected team -->
        <q-card-section v-else-if="loadingSelectedTeam" class="bg-indigo-1">
          <q-skeleton type="text" width="50%" />
        </q-card-section>

        <q-card-actions>
          <q-btn
            flat
            color="primary"
            label="Clear Selection"
            icon="clear"
            size="sm"
            @click="$emit('clear-selection')"
          />
        </q-card-actions>
      </q-card>

      <!-- Legend -->
      <q-card flat bordered class="q-ma-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Legend</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list dense>
            <q-item class="q-px-none">
              <q-item-section avatar class="min-width-auto">
                <div class="legend-color" style="background: rgba(25, 118, 210, 0.2); border-color: var(--q-primary);"></div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">Internal Group</q-item-label>
              </q-item-section>
            </q-item>

            <q-item class="q-px-none">
              <q-item-section avatar class="min-width-auto">
                <div class="legend-color" style="background: rgba(242, 192, 55, 0.2); border-color: var(--q-warning);"></div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">External Group</q-item-label>
              </q-item-section>
            </q-item>

            <q-item class="q-px-none">
              <q-item-section avatar class="min-width-auto">
                <div class="legend-color" style="background: linear-gradient(135deg, var(--q-positive) 0%, #1B5E20 100%); border-color: var(--q-positive);"></div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">Internal Service</q-item-label>
              </q-item-section>
            </q-item>

            <q-item class="q-px-none">
              <q-item-section avatar class="min-width-auto">
                <div class="legend-color" style="background: linear-gradient(135deg, var(--q-warning) 0%, #F57C00 100%); border-color: var(--q-warning);"></div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">External Service</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-scroll-area>
  </aside>
</template>

<script setup lang="ts">
import type { Team } from '~/generated/api/src'

interface SelectedItem {
  type: 'group' | 'service'
  label: string
  isExternal: boolean
  description?: string
  connections?: Array<{ target: string; port: number }>
  groupName?: string  // Add groupName to track which group the selected item belongs to
}

interface Props {
  groupName: string
  groupDescription?: string
  serviceCount: number
  connectionCount: number
  externalGroupCount: number
  selectedItem?: SelectedItem | null
  teamId?: string
}

const props = defineProps<Props>()

defineEmits<{
  'clear-selection': []
}>()

const api = useApi()
const teamInfo = ref<Team | null>(null)
const loadingTeam = ref(false)
const selectedTeamInfo = ref<Team | null>(null)
const loadingSelectedTeam = ref(false)

// Watch for teamId changes and fetch team info for main group
watch(() => props.teamId, async (newTeamId) => {
  if (newTeamId) {
    loadingTeam.value = true
    try {
      teamInfo.value = await api.getTeamById(newTeamId)
    } catch (error) {
      console.error('Failed to fetch team info:', error)
      teamInfo.value = null
    } finally {
      loadingTeam.value = false
    }
  } else {
    teamInfo.value = null
  }
}, { immediate: true })

// Watch for selected item changes and fetch team info for selected item's group
watch(() => props.selectedItem, async (newSelectedItem) => {
  if (newSelectedItem?.groupName) {
    loadingSelectedTeam.value = true
    try {
      // Fetch group info to get the teamId
      const groupInfo = await api.getGroupInfo(newSelectedItem.groupName)
      if (groupInfo?.teamId) {
        selectedTeamInfo.value = await api.getTeamById(groupInfo.teamId)
      } else {
        selectedTeamInfo.value = null
      }
    } catch (error) {
      console.error('Failed to fetch selected team info:', error)
      selectedTeamInfo.value = null
    } finally {
      loadingSelectedTeam.value = false
    }
  } else {
    selectedTeamInfo.value = null
  }
}, { immediate: true })
</script>

<style scoped>
.sidebar {
  width: 350px;
  height: 100vh;
  background-color: #f5f5f5;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.legend-color {
  width: 30px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid;
  flex-shrink: 0;
}

.min-width-auto {
  min-width: auto !important;
}
</style>
