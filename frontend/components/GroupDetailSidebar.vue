<template>
  <aside class="sidebar">
    <v-sheet class="d-flex flex-column fill-height" elevation="0">
       <v-card v-if="!groupId" variant="outlined" class="ma-4">
         <v-card-text class="text-body-2 text-medium-emphasis">
           {{ placeholderMessage || 'Select an item to see details.' }}
         </v-card-text>
       </v-card>

      <v-card
        v-else
        variant="outlined"
        class="ma-4"
      >
        <v-card-text>
          <div class="text-h6 mb-2">{{ groupTitle }}</div>
          <div v-if="groupInfo?.description" class="text-body-2 text-medium-emphasis">
            {{ groupInfo.description }}
          </div>
          <div v-else-if="serviceId" class="text-body-2 text-medium-emphasis">
            Service: {{ serviceId }}
          </div>
        </v-card-text>
        <v-divider />
        <v-list density="compact">
          <v-list-item>
            <template #prepend>
              <v-icon icon="mdi-badge-account" color="primary" class="mr-2" />
            </template>
            <v-list-item-title>Group ID</v-list-item-title>
            <v-list-item-subtitle>{{ groupId ?? '—' }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>

      <TeamContactCard
        v-if="groupInfo?.teamId"
        :team-id="groupInfo.teamId"
      />
     </v-sheet>
   </aside>
 </template>

<script setup lang="ts">
 import { useGroups } from '~/composables/useGroups'
 import TeamContactCard from '~/components/TeamContactCard.vue'

 interface Props {
   groupId?: string | null
   serviceId?: string | null
   placeholderMessage?: string
 }

 const props = withDefaults(defineProps<Props>(), {
   groupId: null,
   serviceId: null,
   placeholderMessage: ''
 })

 defineEmits<{
   'clear-selection': []
 }>()

 const { data: groupsData } = await useGroups()

 const groupInfo = computed(() => {
   if (!props.groupId) return null
   return groupsData.value?.[props.groupId] ?? null
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
   display: flex;
   flex-direction: column;
 }
 </style>
