import yaml from 'js-yaml'
import {type GroupInfo, validateGroupInfo} from '@mapper/shared'
import {YamlEntityService} from './YamlEntityService.js'

export class GroupService extends YamlEntityService<GroupInfo> {
  constructor(initialFiles: Record<string, string>) {
    super(initialFiles)
    console.debug('[GroupService] initialized')
  }


  protected extractId(relativePath: string): string | null {
    // Only index group-info.yaml files in services/*/group-info.yaml
    const re = /^services\/([^/]+)\/group-info\.yaml$/
    const match = re.exec(relativePath)
    return match ? match[1] : null;
  }

  protected parseEntity(groupId: string, rawYaml: string): GroupInfo | null {
    console.debug('[GroupService] parseEntity', { groupId })
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
    console.debug('[GroupService] getGroup', groupId)
    return this.fetchEntity(groupId)
  }

  async getAllGroups(): Promise<Record<string, GroupInfo>> {
    console.debug('[GroupService] getAllGroups start')
    return this.fetchAllEntities()
  }
}
