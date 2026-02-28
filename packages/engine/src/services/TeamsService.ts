import yaml from 'js-yaml'
import { validateTeam, type Team } from '@mapper/shared'
import { YamlEntityService } from './YamlEntityService.js'

export class TeamsService extends YamlEntityService<Team> {
  constructor(initialFiles: Record<string, string>) {
    super(initialFiles);
  }

  protected extractId(relativePath: string): string | null {
    // Only index files in teams/ and ignore all others
    const re = /^teams\/([^/]+)\.yaml$/
    const match = re.exec(relativePath)
    return match ? match[1] : null;
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
}
