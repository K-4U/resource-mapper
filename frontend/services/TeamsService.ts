import yaml from 'js-yaml'
import { validateTeam, type Team } from '~/types'

let rawTeamFiles = import.meta.glob('../public/teams/*.yaml', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, string>

const TEAM_FILE_INDEX: Record<string, string> = {}
const TEAM_CACHE = new Map<string, Team>()

function rebuildTeamIndex() {
  Object.keys(TEAM_FILE_INDEX).forEach(key => { delete TEAM_FILE_INDEX[key] })
  Object.keys(rawTeamFiles).forEach(path => {
    const normalized = path.replace(/\\/g, '/').replace('../public', '')
    const segments = normalized.split('/').filter(Boolean)
    const fileName = segments[segments.length - 1]
    const teamId = fileName?.replace('.yaml', '')
    if (teamId) {
      TEAM_FILE_INDEX[teamId] = normalized
    }
  })
}

rebuildTeamIndex()

/**
 * Test-only hook so Vitest can inject virtual team YAML files.
 */
export function __setTeamFileMocks(files: Record<string, string>) {
  rawTeamFiles = files
  TEAM_CACHE.clear()
  rebuildTeamIndex()
}

function parseTeam(teamId: string, rawYaml: string): Team | null {
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

class TeamsService {
  /**
   * Loads and caches a team definition so we only parse each YAML file once.
   */
  private loadTeamIntoCache(teamId: string) {
    if (TEAM_CACHE.has(teamId)) {
      return
    }
    const path = TEAM_FILE_INDEX[teamId]
    if (!path) {
      return
    }
    const rawYaml = rawTeamFiles[`../public${path}`]
    if (!rawYaml) {
      return
    }
    const team = parseTeam(teamId, rawYaml)
    if (team) {
      TEAM_CACHE.set(teamId, team)
    }
  }

  /**
   * Returns the parsed data for a single team yaml file.
   */
  async getTeam(teamId: string): Promise<Team | null> {
    this.loadTeamIntoCache(teamId)
    return TEAM_CACHE.get(teamId) ?? null
  }

  /**
   * Returns all teams keyed by their team identifier using getTeam internally.
   */
  async getAllTeams(): Promise<Record<string, Team>> {
    const result: Record<string, Team> = {}
    for (const teamId of Object.keys(TEAM_FILE_INDEX)) {
      const team = await this.getTeam(teamId)
      if (team) {
        result[teamId] = team
      }
    }
    return result
  }
}

export const teamsService = new TeamsService()

