import { beforeEach, describe, expect, it } from 'vitest'
import { __setGroupFileMocks, groupService } from '$lib/services/GroupService'

const buildPath = (groupId: string) => `../../../data/services/${groupId}/group-info.yaml`

describe('ResourceService', () => {
  beforeEach(() => {
    __setGroupFileMocks({})
  })

  it('parses group metadata from YAML files', async () => {
    __setGroupFileMocks({
      [buildPath('api')]: 'name: API Services\ndescription: Core entrypoints\nteamId: cloud-core\n'
    })

    const group = await groupService.getGroup('api')

    expect(group).toEqual({
      groupName: 'api',
      name: 'API Services',
      description: 'Core entrypoints',
      teamId: 'cloud-core'
    })
  })

  it('returns all discovered groups keyed by folder name', async () => {
    __setGroupFileMocks({
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
    const group = await groupService.getGroup('missing')
    expect(group).toBeNull()
  })
})

