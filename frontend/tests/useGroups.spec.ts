import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

const { resourceServiceMock, useAsyncDataMock } = vi.hoisted(() => ({
  resourceServiceMock: {
    getAllGroups: vi.fn(),
    getGroup: vi.fn()
  },
  useAsyncDataMock: vi.fn()
}))

vi.mock('~/services/ResourceService', () => ({
  resourceService: resourceServiceMock
}))

vi.mock('#app', () => ({
  useAsyncData: (...args: unknown[]) => useAsyncDataMock(...args)
}))

import { useGroups, useGroup } from '~/composables/useGroups'

describe('useGroups composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resourceServiceMock.getAllGroups.mockReset()
    resourceServiceMock.getGroup.mockReset()
    useAsyncDataMock.mockReset()
  })

  it('wraps resourceService.getAllGroups inside useAsyncData', async () => {
    const asyncDataResult = { data: 'groups' }
    const expectedGroups = { api: { groupId: 'api' } }
    useAsyncDataMock.mockReturnValue(asyncDataResult)
    resourceServiceMock.getAllGroups.mockResolvedValue(expectedGroups)

    const result = useGroups()

    expect(result).toBe(asyncDataResult)
    expect(useAsyncDataMock).toHaveBeenCalledWith('groups', expect.any(Function))

    const fetcher = useAsyncDataMock.mock.calls[0][1]
    await fetcher()
    expect(resourceServiceMock.getAllGroups).toHaveBeenCalledTimes(1)
  })

  it('derives reactive keys and fetchers for useGroup', async () => {
    const asyncDataResult = { data: 'group' }
    useAsyncDataMock.mockReturnValue(asyncDataResult)
    const groupRef = ref('api')
    const groupResponse = {
      groupId: 'api',
      name: 'API',
      description: 'desc',
      team: 'team'
    }
    resourceServiceMock.getGroup.mockResolvedValue(groupResponse)

    const result = useGroup(groupRef)

    expect(result).toBe(asyncDataResult)
    const [keyGetter, fetcher, options] = useAsyncDataMock.mock.calls[0]
    expect(typeof keyGetter).toBe('function')
    expect(typeof fetcher).toBe('function')
    expect(keyGetter()).toBe('group-api')

    await fetcher()
    expect(resourceServiceMock.getGroup).toHaveBeenCalledWith('api')

    expect(options?.watch).toBeDefined()
    const watcher = options?.watch?.[0]
    expect(watcher?.()).toBe('api')

    groupRef.value = 'data'
    expect(keyGetter()).toBe('group-data')
    expect(watcher?.()).toBe('data')
  })

  it('short-circuits fetch when group identifier is missing', async () => {
    const asyncDataResult = { data: null }
    useAsyncDataMock.mockReturnValue(asyncDataResult)
    const emptyRef = ref<string | null>(null)

    useGroup(emptyRef)
    const [, fetcher] = useAsyncDataMock.mock.calls[0]

    const value = await fetcher()
    expect(value).toBeNull()
    expect(resourceServiceMock.getGroup).not.toHaveBeenCalled()
  })
})
