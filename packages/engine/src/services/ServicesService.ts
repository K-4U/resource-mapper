import yaml from 'js-yaml'
import {
  validateServiceDefinition,
  type ExternalConnectionDirection,
  type ExternalGroupServices,
  type GroupInfo,
  type ServiceDefinition,
  type ServiceIncomingLink
} from '@mapper/shared'
import { YamlEntityService } from './YamlEntityService.js'
import type { GroupService } from './GroupService.js'

export class ServicesService extends YamlEntityService<ServiceDefinition> {
  private incomingConnectionsPopulated = false
  private groupService: GroupService

  constructor(initialFiles: Record<string, string> | null = null, groupService: GroupService) {
    super(
        initialFiles ??
        import.meta.glob('../../../data/services/*/*.yaml', {
          eager: true,
          import: 'default',
          query: '?raw'
        })
    )
    this.groupService = groupService
  }

  protected extractId(relativePath: string): string | null {
    const segments = relativePath.split('/').filter(Boolean)
    const servicesIndex = segments.lastIndexOf('services')
    if (servicesIndex === -1 || servicesIndex + 2 >= segments.length) {
      return null
    }
    const groupId = segments[servicesIndex + 1]
    const fileName = segments[servicesIndex + 2]
    if (fileName === 'group-info.yaml' || !fileName.endsWith('.yaml')) {
      return null
    }
    const serviceId = fileName.replace('.yaml', '')
    return `${groupId}/${serviceId}`
  }

  protected parseEntity(identifier: string, rawYaml: string): ServiceDefinition | null {
    console.debug('[ServicesService] parseEntity', identifier)
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
      service.groupId = groupId
      service.identifier = serviceId
      return service
    } catch (error) {
      console.error(`[ServicesService] Failed to parse service ${identifier}:`, error)
      throw error
    }
  }

  async getService(groupId: string, serviceId: string): Promise<ServiceDefinition | null> {
    console.debug('[ServicesService] getService', { groupId, serviceId })
    await this.ensureIncomingConnectionsPopulated()
    return this.fetchEntity(`${groupId}/${serviceId}`)
  }

  async getServicesByGroup(groupId: string): Promise<ServiceDefinition[]> {
    console.debug('[ServicesService] getServicesByGroup start', groupId)
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
    console.debug('[ServicesService] getServicesByGroup result', { groupId, count: result.length })
    return result
  }

  async getAllServices(): Promise<Record<string, ServiceDefinition>> {
    console.debug('[ServicesService] getAllServices invoked')
    return this.ensureIncomingConnectionsPopulated()
  }

  async getExternalServicesForGroup(groupId: string): Promise<ExternalGroupServices[]> {
    console.debug('[ServicesService] getExternalServicesForGroup start', groupId)
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
        const group = (await this.groupService.getGroup(externalGroupId)) ?? this.createFallbackGroup(externalGroupId)
        results.push({ group, services: resolvedServices, direction })
      }
    }

    await buildEntries(outgoingTargets, 'outgoing')
    await buildEntries(incomingTargets, 'incoming')

    console.debug('[ServicesService] getExternalServicesForGroup result', {
      groupId,
      entries: results.length
    })
    return results
  }

  private createFallbackGroup(groupId: string): GroupInfo {
    console.warn('[ServicesService] createFallbackGroup for missing group', groupId)
    return {
      id: groupId,
      name: groupId,
      description: undefined,
      teamId: undefined,
      groupName: groupId
    }
  }

  private async ensureIncomingConnectionsPopulated(): Promise<Record<string, ServiceDefinition>> {
    console.debug('[ServicesService] ensureIncomingConnectionsPopulated invoked')
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
          sourceIdentifier: { groupId: service.groupId, serviceId: service.identifier },
          description: connection.description
        }
        targetService.incomingConnections?.push(incomingEntry)
      })
    })

    this.incomingConnectionsPopulated = true
    console.debug('[ServicesService] incoming connections populated for', Object.keys(services).length, 'services')
    return services
  }

  __setServiceFileMocks(files: Record<string, string>) {
    console.debug('[ServicesService] __setServiceFileMocks override', Object.keys(files).length)
    this.setFileMocks(files)
    this.incomingConnectionsPopulated = false
  }
}
