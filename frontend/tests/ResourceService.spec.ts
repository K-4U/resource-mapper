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
      groupName: 'api',
      name: 'API',
      description: 'API group',
      teamId: 'team-api'
    })
  })

  it('returns all discovered groups keyed by folder name', async () => {
    const resourceService = await createResourceService({
      '../public/services/api/group-info.yaml': `\nname: API\ndescription: Public APIs\nteamId: api-team\n`,
      '../public/services/data/group-info.yaml': `\nname: Data\ndescription: Data platform\nteamId: data-team\n`
    })

    const groups = await resourceService.getAllGroups()

    expect(groups).toEqual({
      api: {
        groupName: 'api',
        name: 'API',
        description: 'Public APIs',
        teamId: 'api-team'
      },
      data: {
        groupName: 'data',
        name: 'Data',
        description: 'Data platform',
        teamId: 'data-team'
      }
    })
  })

  it('returns null when a group folder is missing', async () => {
    const resourceService = await createResourceService({})

    const result = await resourceService.getGroup('unknown')

    expect(result).toBeNull()
  })
})
