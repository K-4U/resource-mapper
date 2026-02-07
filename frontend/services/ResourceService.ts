import yaml from 'js-yaml'

export type Group = {
  groupId: string
  name: string
  description: string
  team: string
}

let rawGroupInfoFiles = import.meta.glob('../public/services/*/group-info.yaml', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, string>

const GROUP_FILE_INDEX: Record<string, string> = {}
const GROUP_INFO_CACHE = new Map<string, Group>()

function rebuildGroupIndex() {
  Object.keys(GROUP_FILE_INDEX).forEach(key => { delete GROUP_FILE_INDEX[key] })
  Object.keys(rawGroupInfoFiles).forEach(path => {
    const normalized = path.replace(/\\/g, '/').replace('../public', '')
    const segments = normalized.split('/').filter(Boolean)
    const groupId = segments[1]
    if (groupId) {
      GROUP_FILE_INDEX[groupId] = normalized
    }
  })
}

rebuildGroupIndex()

/**
 * Test-only hook that lets us inject virtual group-info files.
 */
export function __setGroupFileMocks(files: Record<string, string>) {
  rawGroupInfoFiles = files
  GROUP_INFO_CACHE.clear()
  rebuildGroupIndex()
}

/**
 * Parses the YAML contents of a group's group-info file into a Group object.
 */
function parseGroupInfo(groupId: string, rawYaml: string): Group | null {
  const parsed = yaml.load(rawYaml)
  if (!parsed || typeof parsed !== 'object') {
    return null
  }
  const data = parsed as Record<string, unknown>
  const name = typeof data.name === 'string' ? data.name : groupId
  const description = typeof data.description === 'string' ? data.description : ''
  const teamId = typeof data.teamId === 'string' ? data.teamId : ''
  return { groupId, name, description, team: teamId }
}

class ResourceService {
  /**
   * Loads and caches a group's metadata so subsequent calls avoid re-parsing YAML.
   */
  private loadGroupIntoCache(groupId: string) {
    if (GROUP_INFO_CACHE.has(groupId)) {
      return
    }
    const path = GROUP_FILE_INDEX[groupId]
    if (!path) {
      return
    }
    const rawYaml = rawGroupInfoFiles[`../public${path}`]
    if (!rawYaml) {
      return
    }
    const group = parseGroupInfo(groupId, rawYaml)
    if (group) {
      GROUP_INFO_CACHE.set(groupId, group)
    }
  }

  /**
   * Returns a single group descriptor by folder name.
   */
  async getGroup(groupId: string): Promise<Group | null> {
    this.loadGroupIntoCache(groupId)
    return GROUP_INFO_CACHE.get(groupId) ?? null
  }

  /**
   * Lists every discovered group, keyed by its folder name.
   */
  async getAllGroups(): Promise<Record<string, Group>> {
    const result: Record<string, Group> = {}
    for (const groupId of Object.keys(GROUP_FILE_INDEX)) {
      const group = await this.getGroup(groupId)
      if (group) {
        result[groupId] = group
      }
    }
    return result
  }
}

export const resourceService = new ResourceService()
