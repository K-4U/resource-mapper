import yaml from 'js-yaml'
import { validateServiceDefinition, type ServiceDefinition } from '~/types'
import { YamlEntityService } from './YamlEntityService'

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
      return null
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

  __setServiceFileMocks(files: Record<string, string>) {
    this.setFileMocks(files)
  }
}

export const servicesService = new ServicesService()

export function __setServiceFileMocks(files: Record<string, string>) {
  servicesService.__setServiceFileMocks(files)
}
