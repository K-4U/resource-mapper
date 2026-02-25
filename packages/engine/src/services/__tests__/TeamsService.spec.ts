import { beforeEach, describe, expect, it } from 'vitest'
import { __setTeamFileMocks, teamsService } from 'scripts/services/TeamsService'

const buildTeamPath = (teamId: string) => `../../../data/teams/${teamId}.yaml`

describe('TeamsService', () => {
  beforeEach(() => {
    __setTeamFileMocks({})
  })

  it('returns team information for a given team id', async () => {
    __setTeamFileMocks({
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
    __setTeamFileMocks({
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
    const result = await teamsService.getTeam('missing')
    expect(result).toBeNull()
  })
})

