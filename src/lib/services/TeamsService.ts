import yaml from 'js-yaml'
import { validateTeam, type Team } from '$lib/types'
import { YamlEntityService } from './YamlEntityService'

class TeamsService extends YamlEntityService<Team> {
  constructor() {
    const files = import.meta.glob('../../../data/teams/*.yaml', {
      eager: true,
      import: 'default',
      query: '?raw'
    }) as Record<string, string>
    console.debug('[TeamsService] constructor globbed files', Object.keys(files).length)
    super(files)
  }

  protected extractId(relativePath: string): string | null {
    console.debug('[TeamsService] extractId', relativePath)
    const segments = relativePath.split('/').filter(Boolean)
    if (segments.length === 0) {
      return null
    }
    const fileName = segments[segments.length - 1]
    if (!fileName.endsWith('.yaml')) {
      return null
    }
    return fileName.replace('.yaml', '')
  }

  protected parseEntity(teamId: string, rawYaml: string): Team | null {
    console.debug('[TeamsService] parseEntity', teamId)
    try {
      const parsed = yaml.load(rawYaml)
      if (!parsed || typeof parsed !== 'object') {
        return null
      }
      return validateTeam(parsed, teamId)
    } catch (error) {
      console.error(`Failed to parse team ${teamId}:`, error)
      return null
    }
  }

  async getTeam(teamId: string): Promise<Team | null> {
    console.debug('[TeamsService] getTeam', teamId)
    return this.fetchEntity(teamId)
  }

  async getAllTeams(): Promise<Record<string, Team>> {
    console.debug('[TeamsService] getAllTeams invoked')
    return this.fetchAllEntities()
  }

  __setTeamFileMocks(files: Record<string, string>) {
    console.debug('[TeamsService] __setTeamFileMocks override', Object.keys(files).length)
    this.setFileMocks(files)
  }
}

export const teamsService = new TeamsService()

export function __setTeamFileMocks(files: Record<string, string>) {
  teamsService.__setTeamFileMocks(files)
}
