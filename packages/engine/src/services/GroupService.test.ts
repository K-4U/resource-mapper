import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GroupService } from './GroupService.ts'
import { logger } from '../cli/utils/logger.js'

const buildPath = (groupId: string) => `services/${groupId}/group-info.yaml`

let groupService: GroupService

function resetMocks(mocks: Record<string, string> = {}) {
  groupService = new GroupService({})
  groupService.setFileMocks(mocks)
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

  it('ignores non-group files when rebuilding index', async () => {
    // Add a non-matching file path alongside a valid group-info file
    resetMocks({
      [buildPath('api')]: 'name: API\n',
      ['services/api/ignore-this-file.yaml']: 'should: be ignored\n'
    })

    const groups = await groupService.getAllGroups()
    // Only the valid group-info entry should be indexed
    expect(groups).toHaveProperty('api')
    expect(Object.keys(groups)).toHaveLength(1)
  })

  it('returns null for invalid/empty group YAML (parseEntity returns null)', async () => {
    // Empty file should parse to null and thus be ignored during caching
    resetMocks({
      [buildPath('api')]: ''
    })

    const group = await groupService.getGroup('api')
    expect(group).toBeNull()
  })

  it('parseEntity returns null and logs error for invalid YAML', () => {
    // Arrange: mock logger.error
    const errorSpy = vi.spyOn(logger, 'error')
    const service = new GroupService({})
    // Act: call parseEntity with invalid YAML
    const result = service['parseEntity']('api', 'invalid: yaml: : :')
    // Assert: returns null and logs error
    expect(result).toBeNull()
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to parse group info for api:'), expect.any(Error))
    errorSpy.mockRestore()
  })
})
