import type { ServiceConnection } from '~/types'
import { servicesService } from './ServicesService'

function cloneEdges(edges: ServiceConnection[]): ServiceConnection[] {
  return edges.map(edge => ({ ...edge }))
}

class ConnectionsService {
  private connectionsFromService = new Map<string, ServiceConnection[]>()
  private connectionsToService = new Map<string, ServiceConnection[]>()
  private servicesByGroup = new Map<string, Set<string>>()
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

  async getConnectionsFromGroup(groupId: string): Promise<ServiceConnection[]> {
    await this.ensureLoaded()
    const serviceIds = this.servicesByGroup.get(groupId)
    if (!serviceIds) {
      return []
    }
    const results: ServiceConnection[] = []
    serviceIds.forEach(serviceId => {
      const edges = this.connectionsFromService.get(serviceId)
      if (edges) {
        results.push(...edges)
      }
    })
    return cloneEdges(results)
  }

  async getConnectionsToGroup(groupId: string): Promise<ServiceConnection[]> {
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
      results.push(...edges)
    })
    return cloneEdges(results)
  }

  __reset() {
    this.connectionsFromService.clear()
    this.connectionsToService.clear()
    this.servicesByGroup.clear()
    this.loaded = false
  }
}

export const connectionsService = new ConnectionsService()
