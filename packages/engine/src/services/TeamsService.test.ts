import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamsService } from './TeamsService.ts'
import { logger } from '../cli/utils/logger.js'

const buildTeamPath = (teamId: string) => `teams/${teamId}.yaml`

let teamsService: TeamsService

function resetMocks(mocks: Record<string, string> = {}) {
  teamsService = new TeamsService({})
  teamsService.setFileMocks(mocks)
}

describe('TeamsService', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('returns team information for a given team id', async () => {
    resetMocks({
      [buildTeamPath('cloud-shepherds')]: `name: The Cloud Shepherds\ndescription: Cloud team\nteamLead: Alice\nreachability:\n  - channel: email\n    detail: cloud@example.com\n`
    })

    const team = await teamsService.getTeam('cloud-shepherds')

    expect(team).toEqual({
      name: 'The Cloud Shepherds',
      description: 'Cloud team',
      teamLead: 'Alice',
      teamId: 'cloud-shepherds',
      reachability: [{ channel: 'email', detail: 'cloud@example.com' }]
    })
  })

  it('builds a map of all teams', async () => {
    resetMocks({
      [buildTeamPath('cloud-shepherds')]: 'name: The Cloud Shepherds\n',
      [buildTeamPath('data-wizards')]: 'name: Data Wizards\n'
    })

    const teams = await teamsService.getAllTeams()

    expect(teams).toEqual({
      'cloud-shepherds': expect.objectContaining({ name: 'The Cloud Shepherds', teamId: 'cloud-shepherds' }),
      'data-wizards': expect.objectContaining({ name: 'Data Wizards', teamId: 'data-wizards' })
    })
  })

  it('returns null for unknown teams', async () => {
    resetMocks({})
    const result = await teamsService.getTeam('missing')
    expect(result).toBeNull()
  })

  it('ignores non-team files when rebuilding index', async () => {
    resetMocks({
      [buildTeamPath('cloud-shepherds')]: 'name: Cloud\n',
      ['teams/subdir/should-ignore.yaml']: 'name: ignore\n'
    })

    const teams = await teamsService.getAllTeams()
    expect(Object.keys(teams)).toEqual(['cloud-shepherds'])
  })

  it('returns null when team yaml is invalid or empty', async () => {
    resetMocks({
      [buildTeamPath('cloud-shepherds')]: ''
    })

    const team = await teamsService.getTeam('cloud-shepherds')
    expect(team).toBeNull()
  })

  it('parseEntity returns null and logs error for invalid YAML', () => {
    // Arrange: mock logger.error
    const errorSpy = vi.spyOn(logger, 'error')
    const service = new TeamsService({})
    // Act: call parseEntity with invalid YAML
    const result = service['parseEntity']('cloud-shepherds', 'invalid: yaml: : :')
    // Assert: returns null and logs error
    expect(result).toBeNull()
    expect(errorSpy).toHaveBeenCalledWith('Failed to parse team info for cloud-shepherds:', expect.any(Error))
    errorSpy.mockRestore()
  })
})
