import type { GroupConnection, ServiceConnection, ServiceIdentifier } from '$lib/types'
import { servicesService } from './ServicesService'

const SERVICE_KEY_SEPARATOR = '/'

const toServiceKey = (identifier: ServiceIdentifier) => `${identifier.groupId}${SERVICE_KEY_SEPARATOR}${identifier.serviceId}`

function getGroupFromServiceIdentifier(identifier: ServiceIdentifier | string) {
  if (typeof identifier === 'string') {
    return identifier.split(SERVICE_KEY_SEPARATOR)?.[0] ?? ''
  }
  return identifier?.groupId ?? ''
}

function cloneConnection(edge: ServiceConnection): ServiceConnection {
  return {
    startService: { ...edge.startService },
    targetService: { ...edge.targetService },
    connectionType: edge.connectionType,
    description: edge.description
  }
}

function cloneEdges(edges: ServiceConnection[]): ServiceConnection[] {
  return edges.map(cloneConnection)
}

class ConnectionsService {
  private connectionsFromService = new Map<string, ServiceConnection[]>()
  private connectionsToService = new Map<string, ServiceConnection[]>()
  private servicesByGroup = new Map<string, Set<string>>()
  private groupConnectionCounts = new Map<string, Map<string, number>>()
  private loaded = false

  private addServiceToGroup(groupId: string, serviceKey: string) {
    console.debug('[ConnectionsService] addServiceToGroup', { groupId, serviceKey })
    if (!this.servicesByGroup.has(groupId)) {
      this.servicesByGroup.set(groupId, new Set())
    }
    this.servicesByGroup.get(groupId)!.add(serviceKey)
  }

  private addEdge(sourceKey: string, edge: ServiceConnection) {
    console.debug('[ConnectionsService] addEdge', { sourceKey, target: edge.targetService })
    if (!this.connectionsFromService.has(sourceKey)) {
      this.connectionsFromService.set(sourceKey, [])
    }
    this.connectionsFromService.get(sourceKey)!.push(edge)

    const targetKey = toServiceKey(edge.targetService)
    if (!this.connectionsToService.has(targetKey)) {
      this.connectionsToService.set(targetKey, [])
    }
    this.connectionsToService.get(targetKey)!.push(edge)
    this.recordGroupConnection(edge.startService, edge.targetService)
  }

  private recordGroupConnection(sourceService: ServiceIdentifier, targetService: ServiceIdentifier) {
    const sourceGroup = getGroupFromServiceIdentifier(sourceService)
    const targetGroup = getGroupFromServiceIdentifier(targetService)
    console.debug('[ConnectionsService] recordGroupConnection', { sourceGroup, targetGroup })
    if (!this.groupConnectionCounts.has(sourceGroup)) {
      this.groupConnectionCounts.set(sourceGroup, new Map<string, number>())
    }
    const targetMap = this.groupConnectionCounts.get(sourceGroup)!
    targetMap.set(targetGroup, (targetMap.get(targetGroup) ?? 0) + 1)
  }

  private async ensureLoaded() {
    if (this.loaded) {
      return
    }
    console.debug('[ConnectionsService] ensureLoaded building graph')
    const services = await servicesService.getAllServices()
    Object.values(services).forEach(service => {
      const startServiceKey = `${service.groupName}/${service.identifier}`
      const startTemplate: ServiceIdentifier = { groupId: service.groupName, serviceId: service.identifier }
      this.addServiceToGroup(service.groupName, startServiceKey)

      service.outgoingConnections?.forEach(connection => {
        const edge: ServiceConnection = {
          startService: { ...startTemplate },
          connectionType: connection.connectionType,
          targetService: { ...connection.targetIdentifier },
          description: connection.description
        }
        this.addEdge(startServiceKey, edge)
      })
    })
    this.loaded = true
    console.debug('[ConnectionsService] ensureLoaded complete', {
      services: this.connectionsFromService.size,
      groups: this.servicesByGroup.size
    })
  }

  async getConnectionsFromService(serviceIdentifier: string): Promise<ServiceConnection[]> {
    await this.ensureLoaded()
    const edges = cloneEdges(this.connectionsFromService.get(serviceIdentifier) || [])
    console.debug('[ConnectionsService] getConnectionsFromService', { serviceIdentifier, count: edges.length })
    return edges
  }

  async getConnectionsToService(serviceIdentifier: string): Promise<ServiceConnection[]> {
    await this.ensureLoaded()
    const edges = cloneEdges(this.connectionsToService.get(serviceIdentifier) || [])
    console.debug('[ConnectionsService] getConnectionsToService', { serviceIdentifier, count: edges.length })
    return edges
  }

  async getConnectionsFromGroup(groupId: string, includeSelfConnections = false): Promise<GroupConnection[]> {
    await this.ensureLoaded()
    const serviceIds = this.servicesByGroup.get(groupId)
    if (!serviceIds) {
      return []
    }
    const groupCounts = new Map<string, number>()
    serviceIds.forEach(serviceKey => {
      const edges = this.connectionsFromService.get(serviceKey)
      if (!edges) {
        return
      }
      edges.forEach(edge => {
        const targetGroup = edge.targetService.groupId
        if (!includeSelfConnections && targetGroup === groupId) {
          return
        }
        groupCounts.set(targetGroup, (groupCounts.get(targetGroup) ?? 0) + 1)
      })
    })
    const results: GroupConnection[] = []
    groupCounts.forEach((count, targetGroup) => {
      results.push({ sourceGroup: groupId, targetGroup, connectionCount: count })
    })
    console.debug('[ConnectionsService] getConnectionsFromGroup', { groupId, includeSelfConnections, count: results.length })
    return results
  }

  async getConnectionsToGroup(groupId: string, includeSelfConnections = false): Promise<GroupConnection[]> {
    await this.ensureLoaded()
    const serviceIds = this.servicesByGroup.get(groupId)
    if (!serviceIds) {
      return []
    }
    const prefix = `${groupId}/`
    const groupCounts = new Map<string, number>()
    this.connectionsToService.forEach((edges, targetKey) => {
      if (!targetKey.startsWith(prefix)) {
        return
      }
      edges.forEach(edge => {
        const startGroup = edge.startService.groupId
        if (!includeSelfConnections && startGroup === groupId) {
          return
        }
        groupCounts.set(startGroup, (groupCounts.get(startGroup) ?? 0) + 1)
      })
    })
    const results: GroupConnection[] = []
    groupCounts.forEach((count, sourceGroup) => {
      results.push({ sourceGroup, targetGroup: groupId, connectionCount: count })
    })
    console.debug('[ConnectionsService] getConnectionsToGroup', { groupId, includeSelfConnections, count: results.length })
    return results
  }

  async getAllGroupConnections(includeSelfConnections = false): Promise<GroupConnection[]> {
    await this.ensureLoaded()
    const result: GroupConnection[] = []
    this.groupConnectionCounts.forEach((targets, sourceGroup) => {
      targets.forEach((count, targetGroup) => {
        if (!includeSelfConnections && sourceGroup === targetGroup) {
          return
        }
        result.push({ sourceGroup, targetGroup, connectionCount: count })
      })
    })
    console.debug('[ConnectionsService] getAllGroupConnections', {
      includeSelfConnections,
      count: result.length
    })
    return result
  }

  __reset() {
    console.debug('[ConnectionsService] __reset invoked')
    this.connectionsFromService.clear()
    this.connectionsToService.clear()
    this.servicesByGroup.clear()
    this.groupConnectionCounts.clear()
    this.loaded = false
  }
}

export const connectionsService = new ConnectionsService()

