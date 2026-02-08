import yaml from 'js-yaml'
import { validateGroupInfo, type GroupInfo } from '$lib/types'
import { YamlEntityService } from './YamlEntityService'

class ResourceService extends YamlEntityService<GroupInfo> {
  constructor() {
    super(
      import.meta.glob('../../../data/services/*/group-info.yaml', {
        eager: true,
        import: 'default',
        query: '?raw'
      }) as Record<string, string>
    )
    console.debug('[ResourceService] initialized')
  }

  protected extractId(relativePath: string): string | null {
    const segments = relativePath.split('/').filter(Boolean)
    const servicesIndex = segments.lastIndexOf('services')
    if (servicesIndex === -1 || servicesIndex + 1 >= segments.length) {
      return null
    }
    return segments[servicesIndex + 1]
  }

  protected parseEntity(groupId: string, rawYaml: string): GroupInfo | null {
    console.debug('[ResourceService] parseEntity', { groupId })
    try {
      const parsed = yaml.load(rawYaml)
      if (!parsed || typeof parsed !== 'object') {
        return null
      }
      return validateGroupInfo(parsed, groupId)
    } catch (error) {
      console.error(`Failed to parse group info for ${groupId}:`, error)
      return null
    }
  }

  async getGroup(groupId: string): Promise<GroupInfo | null> {
    console.debug('[ResourceService] getGroup', groupId)
    return this.fetchEntity(groupId)
  }

  async getAllGroups(): Promise<Record<string, GroupInfo>> {
    console.debug('[ResourceService] getAllGroups start')
    return this.fetchAllEntities()
  }

  __setGroupFileMocks(files: Record<string, string>) {
    console.debug('[ResourceService] __setGroupFileMocks', Object.keys(files))
    this.setFileMocks(files)
  }
}

export const resourceService = new ResourceService()

export function __setGroupFileMocks(files: Record<string, string>) {
  resourceService.__setGroupFileMocks(files)
}
