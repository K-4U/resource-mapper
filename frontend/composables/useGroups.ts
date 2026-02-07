import { unref, type MaybeRef } from 'vue'
import { useAsyncData } from '#app'
import { resourceService, type Group } from '~/services/ResourceService'

/**
 * Provides all groups and keeps the ResourceService details hidden from components.
 */
export function useGroups() {
  return useAsyncData<Record<string, Group>>('groups', () => resourceService.getAllGroups())
}

/**
 * Fetches a single group, keyed by its folder name.
 */
export function useGroup(groupId: MaybeRef<string | null | undefined>) {
  return useAsyncData<Group | null>(
    () => {
      const id = unref(groupId)
      return id ? `group-${id}` : 'group-null'
    },
    () => {
      const id = unref(groupId)
      if (!id) {
        return null
      }
      return resourceService.getGroup(id)
    },
    {
      watch: [() => unref(groupId)]
    }
  )
}
