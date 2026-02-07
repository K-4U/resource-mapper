import type { ServiceConnection } from '~/types'
import type { GroupConnection } from '~/types'
import { servicesService } from './ServicesService'

function getGroupFromServiceIdentifier(identifier: string) {
  return identifier?.split('/')?.[0] ?? ''
}

function cloneEdges(edges: ServiceConnection[]): ServiceConnection[] {
  return edges.map(edge => ({ ...edge }))
}

class ConnectionsService {
  private connectionsFromService = new Map<string, ServiceConnection[]>()
  private connectionsToService = new Map<string, ServiceConnection[]>()
  private servicesByGroup = new Map<string, Set<string>>()
  private groupConnectionCounts = new Map<string, Map<string, number>>()
  private loaded = false

  private addServiceToGroup(groupId: string, serviceId: string) {
    if (!this.servicesByGroup.has(groupId)) {
      this.servicesByGroup.set(groupId, new Set())
    }
    this.servicesByGroup.get(groupId)!.add(serviceId)
  }

  private addEdge(source: string, edge: ServiceConnection) {
    if (!this.connectionsFromService.has(source)) {
      this.connectionsFromService.set(source, [])
    }
    this.connectionsFromService.get(source)!.push(edge)

    if (!this.connectionsToService.has(edge.targetService)) {
      this.connectionsToService.set(edge.targetService, [])
    }
    this.connectionsToService.get(edge.targetService)!.push(edge)
    this.recordGroupConnection(source, edge.targetService)
  }

  private recordGroupConnection(sourceService: string, targetService: string) {
    const sourceGroup = getGroupFromServiceIdentifier(sourceService)
    const targetGroup = getGroupFromServiceIdentifier(targetService)
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
    const services = await servicesService.getAllServices()
    Object.entries(services).forEach(([identifier, service]) => {
      const startService = `${service.groupName}/${service.identifier}`
      this.addServiceToGroup(service.groupName, startService)
      service.outgoingConnections?.forEach(connection => {
        const edge: ServiceConnection = {
          startService,
          connectionType: connection.connectionType,
          targetService: connection.targetIdentifier,
          description: connection.description
        }
        this.addEdge(startService, edge)
      })
    })
    this.loaded = true
  }

  async getConnectionsFromService(serviceIdentifier: string): Promise<ServiceConnection[]> {
    await this.ensureLoaded()
    return cloneEdges(this.connectionsFromService.get(serviceIdentifier) || [])
  }

  async getConnectionsToService(serviceIdentifier: string): Promise<ServiceConnection[]> {
    await this.ensureLoaded()
    return cloneEdges(this.connectionsToService.get(serviceIdentifier) || [])
  }

  async getConnectionsFromGroup(groupId: string, includeSelfConnections = false): Promise<ServiceConnection[]> {
    await this.ensureLoaded()
    const serviceIds = this.servicesByGroup.get(groupId)
    if (!serviceIds) {
      return []
    }
    const results: ServiceConnection[] = []
    serviceIds.forEach(serviceId => {
      const edges = this.connectionsFromService.get(serviceId)
      if (!edges) {
        return
      }
      edges.forEach(edge => {
        const targetGroup = getGroupFromServiceIdentifier(edge.targetService)
        if (!includeSelfConnections && targetGroup === groupId) {
          return
        }
        results.push(edge)
      })
    })
    return cloneEdges(results)
  }

  async getConnectionsToGroup(groupId: string, includeSelfConnections = false): Promise<ServiceConnection[]> {
    await this.ensureLoaded()
    const serviceIds = this.servicesByGroup.get(groupId)
    if (!serviceIds) {
      return []
    }
    const prefix = `${groupId}/`
    const results: ServiceConnection[] = []
    this.connectionsToService.forEach((edges, targetService) => {
      if (!targetService.startsWith(prefix)) {
        return
      }
      edges.forEach(edge => {
        const startGroup = getGroupFromServiceIdentifier(edge.startService)
        if (!includeSelfConnections && startGroup === groupId) {
          return
        }
        results.push(edge)
      })
    })
    return cloneEdges(results)
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
    return result
  }

  __reset() {
    this.connectionsFromService.clear()
    this.connectionsToService.clear()
    this.servicesByGroup.clear()
    this.groupConnectionCounts.clear()
    this.loaded = false
  }
}

export const connectionsService = new ConnectionsService()
