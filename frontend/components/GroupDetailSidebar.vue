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

        <q-card-section v-if="selectedItem.type === 'service' && selectedItem.connections">
          <div class="text-weight-medium q-mb-sm">Connections</div>
          <q-list dense bordered separator>
            <q-item v-for="conn in selectedItem.connections" :key="conn.target">
              <q-item-section>
                <q-item-label>{{ conn.target }}</q-item-label>
                <q-item-label caption>Port: {{ conn.port }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
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
interface SelectedItem {
  type: 'group' | 'service'
  label: string
  isExternal: boolean
  description?: string
  connections?: Array<{ target: string; port: number }>
}

interface Props {
  groupName: string
  groupDescription?: string
  serviceCount: number
  connectionCount: number
  externalGroupCount: number
  selectedItem?: SelectedItem | null
}

defineProps<Props>()

defineEmits<{
  'clear-selection': []
}>()
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
