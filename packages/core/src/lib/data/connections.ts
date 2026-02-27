import type { GroupConnection } from '$shared/types'
import bakedData from 'virtual:mapper-data'

export async function getConnectionsFromGroup(groupId: string | null | undefined): Promise<GroupConnection[]> {
  if (!groupId) return []
  // Not pre-baked, so filter from all groupConnections
  return (bakedData.groupConnections as GroupConnection[]).filter(c => c.sourceGroup === groupId)
}

export async function getConnectionsToGroup(groupId: string | null | undefined): Promise<GroupConnection[]> {
  if (!groupId) return []
  // Not pre-baked, so filter from all groupConnections
  return (bakedData.groupConnections as GroupConnection[]).filter(c => c.targetGroup === groupId)
}

export async function getAllGroupConnections(): Promise<GroupConnection[]> {
  // Returns all group connections except self connections
  return (bakedData.groupConnections as GroupConnection[]).filter(
    c => c.sourceGroup !== c.targetGroup
  )
}

export async function getAllGroupConnectionsWithSelf(): Promise<GroupConnection[]> {
  // Returns all group connections including self connections
  return bakedData.groupConnections as GroupConnection[]
}
