import yaml from 'js-yaml'
import { validateServiceDefinition, type ExternalGroupServices, type GroupInfo, type ServiceDefinition } from '~/types'
import { YamlEntityService } from './YamlEntityService'
import { resourceService } from './ResourceService'

class ServicesService extends YamlEntityService<ServiceDefinition> {
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
    return this.fetchEntity(`${groupId}/${serviceId}`)
  }

  async getServicesByGroup(groupId: string): Promise<ServiceDefinition[]> {
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
    return this.fetchAllEntities()
  }

  async getExternalServicesForGroup(groupId: string): Promise<ExternalGroupServices[]> {
    const services = await this.getServicesByGroup(groupId)
    const groupedTargets = new Map<string, Set<string>>()

    services.forEach(service => {
      service.outgoingConnections?.forEach(connection => {
        const target = connection.targetIdentifier
        if (!target.groupId || !target.serviceId || target.groupId === groupId) {
          return
        }
        if (!groupedTargets.has(target.groupId)) {
          groupedTargets.set(target.groupId, new Set())
        }
        groupedTargets.get(target.groupId)!.add(target.serviceId)
      })
    })

    const results: ExternalGroupServices[] = []
    for (const [targetGroupId, serviceIds] of groupedTargets.entries()) {
      const resolvedServices: ServiceDefinition[] = []
      for (const serviceId of serviceIds) {
        const definition = await this.getService(targetGroupId, serviceId)
        if (definition) {
          resolvedServices.push(definition)
        }
      }
      if (!resolvedServices.length) {
        continue
      }
      const group = (await resourceService.getGroup(targetGroupId)) ?? this.createFallbackGroup(targetGroupId)
      results.push({ group, services: resolvedServices })
    }
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

  __setServiceFileMocks(files: Record<string, string>) {
    this.setFileMocks(files)
  }
}

export const servicesService = new ServicesService()

export function __setServiceFileMocks(files: Record<string, string>) {
  servicesService.__setServiceFileMocks(files)
}
