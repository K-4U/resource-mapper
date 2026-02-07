import { describe, it, expect, vi } from 'vitest'

async function createResourceService(files: Record<string, string>) {
  vi.resetModules()
  const module = await import('~/services/ResourceService')
  module.__setGroupFileMocks(files)
  return module.resourceService
}

describe('ResourceService', () => {
  it('parses group metadata from YAML files', async () => {
    const resourceService = await createResourceService({
      '../public/services/api/group-info.yaml': `\nname: API\ndescription: API group\nteamId: team-api\n`
    })

    const group = await resourceService.getGroup('api')

    expect(group).toEqual({
      groupId: 'api',
      name: 'API',
      description: 'API group',
      team: 'team-api'
    })
  })

  it('returns all discovered groups keyed by folder name', async () => {
    const resourceService = await createResourceService({
      '../public/services/api/group-info.yaml': `\nname: API\ndescription: Public APIs\nteamId: api-team\n`,
      '../public/services/data/group-info.yaml': `\ndescription: Data platform\n`
    })

    const groups = await resourceService.getAllGroups()

    expect(groups).toEqual({
      api: {
        groupId: 'api',
        name: 'API',
        description: 'Public APIs',
        team: 'api-team'
      },
      data: {
        groupId: 'data',
        name: 'data',
        description: 'Data platform',
        team: ''
      }
    })
  })

  it('returns null when a group folder is missing', async () => {
    const resourceService = await createResourceService({})

    const result = await resourceService.getGroup('unknown')

    expect(result).toBeNull()
  })
})
