import yaml from 'js-yaml'
import { validateServiceDefinition, type ExternalConnectionDirection, type ExternalGroupServices, type GroupInfo, type ServiceDefinition, type ServiceIncomingLink } from '~/types'
import { YamlEntityService } from './YamlEntityService'
import { resourceService } from './ResourceService'

class ServicesService extends YamlEntityService<ServiceDefinition> {
  private incomingConnectionsPopulated = false

  constructor() {
    super(import.meta.glob('../public/services/*/*.yaml', {
      eager: true,
      import: 'default',
      query: '?raw'
    }) as Record<string, string>)
  }

  protected extractId(relativePath: string): string | null {
    const segments = relativePath.split('/').filter(Boolean)
    if (segments.length < 3) {
      return null
    }
    const groupId = segments[1]
    const fileName = segments[2]
    if (fileName === 'group-info.yaml' || !fileName.endsWith('.yaml')) {
      return null
    }
    const serviceId = fileName.replace('.yaml', '')
    return `${groupId}/${serviceId}`
  }

  protected parseEntity(identifier: string, rawYaml: string): ServiceDefinition | null {
    try {
      const parsed = yaml.load(rawYaml)
      if (!parsed || typeof parsed !== 'object') {
        return null
      }
      const [groupId, serviceId] = identifier.split('/')
      if (!groupId || !serviceId) {
        return null
      }
      const service = validateServiceDefinition(parsed, serviceId)
      service.groupName = groupId
      service.identifier = serviceId
      return service
    } catch (error) {
      console.warn(`Failed to parse service ${identifier}:`, error)
      throw error
    }
  }

  async getService(groupId: string, serviceId: string): Promise<ServiceDefinition | null> {
    await this.ensureIncomingConnectionsPopulated()
    return this.fetchEntity(`${groupId}/${serviceId}`)
  }

  async getServicesByGroup(groupId: string): Promise<ServiceDefinition[]> {
    await this.ensureIncomingConnectionsPopulated()
    const result: ServiceDefinition[] = []
    const prefix = `${groupId}/`
    for (const id of this.getIds()) {
      if (!id.startsWith(prefix)) {
        continue
      }
      const service = await this.fetchEntity(id)
      if (service) {
        result.push(service)
      }
    }
    return result
  }

  async getAllServices(): Promise<Record<string, ServiceDefinition>> {
    return this.ensureIncomingConnectionsPopulated()
  }

  async getExternalServicesForGroup(groupId: string): Promise<ExternalGroupServices[]> {
    const services = await this.getServicesByGroup(groupId)
    const allServices = await this.getAllServices()

    const outgoingTargets = new Map<string, Set<string>>()
    const incomingTargets = new Map<string, Set<string>>()

    services.forEach(service => {
      service.outgoingConnections?.forEach(connection => {
        const target = connection.targetIdentifier
        if (!target.groupId || !target.serviceId || target.groupId === groupId) {
          return
        }
        if (!outgoingTargets.has(target.groupId)) {
          outgoingTargets.set(target.groupId, new Set())
        }
        outgoingTargets.get(target.groupId)!.add(target.serviceId)
      })

      service.incomingConnections?.forEach(connection => {
        const source = connection.sourceIdentifier
        if (!source.groupId || !source.serviceId || source.groupId === groupId) {
          return
        }
        if (!incomingTargets.has(source.groupId)) {
          incomingTargets.set(source.groupId, new Set())
        }
        incomingTargets.get(source.groupId)!.add(source.serviceId)
      })
    })

    const results: ExternalGroupServices[] = []
    const buildEntries = async (
      targetMap: Map<string, Set<string>>,
      direction: ExternalConnectionDirection
    ) => {
      for (const [externalGroupId, serviceIds] of targetMap.entries()) {
        const resolvedServices: ServiceDefinition[] = []
        serviceIds.forEach(serviceId => {
          const key = `${externalGroupId}/${serviceId}`
          const definition = allServices[key]
          if (definition) {
            resolvedServices.push(definition)
          }
        })
        if (!resolvedServices.length) {
          continue
        }
        const group = (await resourceService.getGroup(externalGroupId)) ?? this.createFallbackGroup(externalGroupId)
        results.push({ group, services: resolvedServices, direction })
      }
    }

    await buildEntries(outgoingTargets, 'outgoing')
    await buildEntries(incomingTargets, 'incoming')

    return results
  }

  private createFallbackGroup(groupId: string): GroupInfo {
    return {
      name: groupId,
      description: undefined,
      teamId: undefined,
      groupName: groupId
    }
  }

  private async ensureIncomingConnectionsPopulated(): Promise<Record<string, ServiceDefinition>> {
    const services = await this.fetchAllEntities()
    if (this.incomingConnectionsPopulated) {
      return services
    }

    Object.values(services).forEach(service => {
      service.incomingConnections = []
    })

    Object.entries(services).forEach(([, service]) => {
      service.outgoingConnections?.forEach(connection => {
        const target = connection.targetIdentifier
        if (!target.groupId || !target.serviceId) {
          return
        }
        const targetKey = `${target.groupId}/${target.serviceId}`
        const targetService = services[targetKey]
        if (!targetService) {
          return
        }
        const incomingEntry: ServiceIncomingLink = {
          connectionType: connection.connectionType,
          sourceIdentifier: { groupId: service.groupName, serviceId: service.identifier },
          description: connection.description
        }
        targetService.incomingConnections?.push(incomingEntry)
      })
    })

    this.incomingConnectionsPopulated = true
    return services
  }

  __setServiceFileMocks(files: Record<string, string>) {
    this.setFileMocks(files)
    this.incomingConnectionsPopulated = false
  }
}

export const servicesService = new ServicesService()

export function __setServiceFileMocks(files: Record<string, string>) {
  servicesService.__setServiceFileMocks(files)
}
