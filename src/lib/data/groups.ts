import type { GroupInfo } from '$lib/types'
import { resourceService } from '$lib/services/ResourceService'

export async function getAllGroups(): Promise<Record<string, GroupInfo>> {
  console.debug('[data/groups] getAllGroups called')
  return resourceService.getAllGroups()
}

export async function getGroup(groupId: string | null | undefined): Promise<GroupInfo | null> {
  console.debug('[data/groups] getGroup called', groupId)
  if (!groupId) {
    return null
  }
  return resourceService.getGroup(groupId)
}
