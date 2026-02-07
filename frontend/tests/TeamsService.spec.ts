import { describe, it, expect, vi } from 'vitest'

async function createTeamsService(files: Record<string, string>) {
  vi.resetModules()
  const module = await import('~/services/TeamsService')
  module.__setTeamFileMocks(files)
  return module.teamsService
}

describe('TeamsService', () => {
  it('returns team information for a given team id', async () => {
    const service = await createTeamsService({
      '../public/teams/cloud-shepherds.yaml': `\nname: The Cloud Shepherds\ndescription: Cloud team\nemail: team@example.com\n`
    })

    const team = await service.getTeam('cloud-shepherds')

    expect(team).toEqual({
      name: 'The Cloud Shepherds',
      description: 'Cloud team',
      email: 'team@example.com',
      teamId: 'cloud-shepherds'
    })
  })

  it('builds a map of all teams using getTeam internally', async () => {
    const service = await createTeamsService({
      '../public/teams/cloud-shepherds.yaml': `\nname: The Cloud Shepherds\n`,
      '../public/teams/data-wizards.yaml': `\nname: Data Wizards\n`
    })

    const spy = vi.spyOn(service, 'getTeam')
    const teams = await service.getAllTeams()

    expect(teams).toEqual({
      'cloud-shepherds': {
        name: 'The Cloud Shepherds',
        teamId: 'cloud-shepherds'
      },
      'data-wizards': {
        name: 'Data Wizards',
        teamId: 'data-wizards'
      }
    })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('returns null for unknown teams', async () => {
    const service = await createTeamsService({})
    const result = await service.getTeam('missing')
    expect(result).toBeNull()
  })
})

