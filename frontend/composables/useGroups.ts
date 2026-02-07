import { unref, type MaybeRef } from 'vue'
import { useAsyncData } from '#app'
import { resourceService } from '~/services/ResourceService'
import type { GroupInfo } from '~/types'

/**
 * Provides all groups and keeps the ResourceService details hidden from components.
 */
export function useGroups() {
  return useAsyncData<Record<string, GroupInfo>>('groups', () => resourceService.getAllGroups())
}

/**
 * Fetches a single group, keyed by its folder name.
 */
export function useGroup(groupId: MaybeRef<string | null | undefined>) {
  return useAsyncData<GroupInfo | null>(
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
