import yaml from 'js-yaml'
import { validateTeam, type Team } from '~/types'
import { YamlEntityService } from './YamlEntityService'

class TeamsService extends YamlEntityService<Team> {
  constructor() {
    super(import.meta.glob('../public/teams/*.yaml', {
      eager: true,
      import: 'default',
      query: '?raw'
    }) as Record<string, string>)
  }

  protected extractId(relativePath: string): string | null {
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
    try {
      const parsed = yaml.load(rawYaml)
      if (!parsed || typeof parsed !== 'object') {
        return null
      }
      return validateTeam(parsed, teamId)
    } catch (error) {
      console.warn(`Failed to parse team ${teamId}:`, error)
      return null
    }
  }

  async getTeam(teamId: string): Promise<Team | null> {
    return this.fetchEntity(teamId)
  }

  async getAllTeams(): Promise<Record<string, Team>> {
    return this.fetchAllEntities()
  }

  __setTeamFileMocks(files: Record<string, string>) {
    this.setFileMocks(files)
  }
}

export const teamsService = new TeamsService()

export function __setTeamFileMocks(files: Record<string, string>) {
  teamsService.__setTeamFileMocks(files)
}
