import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

const { teamsServiceMock, useAsyncDataMock } = vi.hoisted(() => ({
  teamsServiceMock: {
    getAllTeams: vi.fn(),
    getTeam: vi.fn()
  },
  useAsyncDataMock: vi.fn()
}))

vi.mock('~/services/TeamsService', () => ({
  teamsService: teamsServiceMock
}))

vi.mock('#app', () => ({
  useAsyncData: (...args: unknown[]) => useAsyncDataMock(...args)
}))

import { useTeams, useTeam } from '~/composables/useTeams'

describe('useTeams composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    teamsServiceMock.getAllTeams.mockReset()
    teamsServiceMock.getTeam.mockReset()
    useAsyncDataMock.mockReset()
  })

  it('wraps teamsService.getAllTeams inside useAsyncData', async () => {
    const asyncDataResult = { data: 'teams' }
    useAsyncDataMock.mockReturnValue(asyncDataResult)
    teamsServiceMock.getAllTeams.mockResolvedValue({})

    const result = useTeams()

    expect(result).toBe(asyncDataResult)
    expect(useAsyncDataMock).toHaveBeenCalledWith('teams', expect.any(Function))

    const fetcher = useAsyncDataMock.mock.calls[0][1]
    await fetcher()
    expect(teamsServiceMock.getAllTeams).toHaveBeenCalledTimes(1)
  })

  it('derives cache keys and fetchers for single team access', async () => {
    const asyncDataResult = { data: 'team' }
    useAsyncDataMock.mockReturnValue(asyncDataResult)
    const idRef = ref('cloud-shepherds')
    const teamResponse = { teamId: 'cloud-shepherds', name: 'Cloud Shepherds' }
    teamsServiceMock.getTeam.mockResolvedValue(teamResponse)

    const result = useTeam(idRef)

    expect(result).toBe(asyncDataResult)
    const [keyGetter, fetcher, options] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('team-cloud-shepherds')

    await fetcher()
    expect(teamsServiceMock.getTeam).toHaveBeenCalledWith('cloud-shepherds')

    const watcher = options?.watch?.[0]
    expect(watcher?.()).toBe('cloud-shepherds')

    idRef.value = 'data-wizards'
    expect(keyGetter()).toBe('team-data-wizards')
    expect(watcher?.()).toBe('data-wizards')
  })

  it('short circuits when no team id is provided', async () => {
    const asyncDataResult = { data: null }
    useAsyncDataMock.mockReturnValue(asyncDataResult)

    useTeam(ref(null))
    const [, fetcher] = useAsyncDataMock.mock.calls[0]

    const value = await fetcher()
    expect(value).toBeNull()
    expect(teamsServiceMock.getTeam).not.toHaveBeenCalled()
  })
})

