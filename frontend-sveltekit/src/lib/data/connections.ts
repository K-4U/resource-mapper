import type { GroupConnection, ServiceConnection } from '$lib/types'
import { connectionsService } from '$lib/services/ConnectionsService'

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

export async function getConnectionsFromService(serviceKey: string | null | undefined): Promise<ServiceConnection[]> {
  console.debug('[data/connections] getConnectionsFromService', serviceKey)
  if (!serviceKey) {
    return []
  }
  return ensureArray(await connectionsService.getConnectionsFromService(serviceKey))
}

export async function getConnectionsToService(serviceKey: string | null | undefined): Promise<ServiceConnection[]> {
  console.debug('[data/connections] getConnectionsToService', serviceKey)
  if (!serviceKey) {
    return []
  }
  return ensureArray(await connectionsService.getConnectionsToService(serviceKey))
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

export async function getServiceConnections(serviceKey: string | null | undefined) {
  console.debug('[data/connections] getServiceConnections', serviceKey)
  if (!serviceKey) {
    return { from: [] as ServiceConnection[], to: [] as ServiceConnection[] }
  }
  const [from, to] = await Promise.all([
    connectionsService.getConnectionsFromService(serviceKey),
    connectionsService.getConnectionsToService(serviceKey)
  ])
  return { from: ensureArray(from), to: ensureArray(to) }
}

export async function getGroupConnectionsSummary(groupId: string | null | undefined) {
  console.debug('[data/connections] getGroupConnectionsSummary', groupId)
  if (!groupId) {
    return { from: [] as GroupConnection[], to: [] as GroupConnection[] }
  }
  const [from, to] = await Promise.all([
    connectionsService.getConnectionsFromGroup(groupId),
    connectionsService.getConnectionsToGroup(groupId)
  ])
  return { from, to }
}
