import { beforeEach, describe, expect, it } from 'vitest'
import { GroupService } from '../GroupService.js'

const buildPath = (groupId: string) => `../../../data/services/${groupId}/group-info.yaml`

let groupService: GroupService

function resetMocks(mocks: Record<string, string> = {}) {
  groupService = new GroupService(mocks)
}

describe('ResourceService', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('parses group metadata from YAML files', async () => {
    resetMocks({
      [buildPath('api')]: 'name: API Services\ndescription: Core entrypoints\nteamId: cloud-core\n'
    })

    const group = await groupService.getGroup('api')

    expect(group).toEqual({
      id: 'api',
      groupName: 'api',
      name: 'API Services',
      description: 'Core entrypoints',
      teamId: 'cloud-core'
    })
  })

  it('returns all discovered groups keyed by folder name', async () => {
    resetMocks({
      [buildPath('api')]: 'name: API\ndescription: Public APIs\nteamId: api\n',
      [buildPath('data')]: 'name: Data Platform\ndescription: Shared data\nteamId: data\n'
    })

    const groups = await groupService.getAllGroups()

    expect(groups).toEqual({
      api: expect.objectContaining({ name: 'API', groupName: 'api', teamId: 'api' }),
      data: expect.objectContaining({ name: 'Data Platform', groupName: 'data', teamId: 'data' })
    })
  })

  it('returns null when a group folder is missing', async () => {
    resetMocks({})
    const group = await groupService.getGroup('missing')
    expect(group).toBeNull()
  })
})
