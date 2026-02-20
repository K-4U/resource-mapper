import type { GroupInfo } from '$lib/types'
import { groupService } from '$lib/services/GroupService'

export async function getAllGroups(): Promise<Record<string, GroupInfo>> {
  console.debug('[data/groups] getAllGroups called')
  return groupService.getAllGroups()
}

export async function getGroup(groupId: string | null | undefined): Promise<GroupInfo | null> {
  console.debug('[data/groups] getGroup called', groupId)
  if (!groupId) {
    return null
  }
  return groupService.getGroup(groupId)
}
