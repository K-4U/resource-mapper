import yaml from 'js-yaml'
import { validateGroupInfo, type GroupInfo } from '~/types'
import { YamlEntityService } from './YamlEntityService'

class ResourceService extends YamlEntityService<GroupInfo> {
  constructor() {
    super(import.meta.glob('../public/services/*/group-info.yaml', {
      eager: true,
      import: 'default',
      query: '?raw'
    }) as Record<string, string>)
  }

  protected extractId(relativePath: string): string | null {
    const segments = relativePath.split('/').filter(Boolean)
    if (segments.length < 2) {
      return null
    }
    return segments[1]
  }

  protected parseEntity(groupId: string, rawYaml: string): GroupInfo | null {
    try {
      const parsed = yaml.load(rawYaml)
      if (!parsed || typeof parsed !== 'object') {
        return null
      }
      return validateGroupInfo(parsed, groupId)
    } catch (error) {
      console.warn(`Failed to parse group info for ${groupId}:`, error)
      return null
    }
  }

  async getGroup(groupId: string): Promise<GroupInfo | null> {
    return this.fetchEntity(groupId)
  }

  async getAllGroups(): Promise<Record<string, GroupInfo>> {
    return this.fetchAllEntities()
  }

  __setGroupFileMocks(files: Record<string, string>) {
    this.setFileMocks(files)
  }
}

export const resourceService = new ResourceService()

export function __setGroupFileMocks(files: Record<string, string>) {
  resourceService.__setGroupFileMocks(files)
}
