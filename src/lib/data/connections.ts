import type { GroupConnection, ServiceConnection } from '$lib/types'
import { connectionsService } from '$lib/services/ConnectionsService'

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}


export async function getConnectionsFromGroup(groupId: string | null | undefined): Promise<GroupConnection[]> {
  console.debug('[data/connections] getConnectionsFromGroup', groupId)
  if (!groupId) {
    return []
  }
  return await connectionsService.getConnectionsFromGroup(groupId)
}

export async function getConnectionsToGroup(groupId: string | null | undefined): Promise<GroupConnection[]> {
  console.debug('[data/connections] getConnectionsToGroup', groupId)
  if (!groupId) {
    return []
  }
  return await connectionsService.getConnectionsToGroup(groupId)
}

export async function getAllGroupConnections(includeSelfConnections = false): Promise<GroupConnection[]> {
  console.debug('[data/connections] getAllGroupConnections', { includeSelfConnections })
  return connectionsService.getAllGroupConnections(includeSelfConnections)
}
