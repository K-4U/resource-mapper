import type { Team } from '$lib/types'
import { teamsService } from '$lib/services/TeamsService'

export async function getAllTeams(): Promise<Record<string, Team>> {
  console.debug('[data/teams] getAllTeams called')
  return teamsService.getAllTeams()
}

export async function getTeam(teamId: string | null | undefined): Promise<Team | null> {
  console.debug('[data/teams] getTeam called', teamId)
  if (!teamId) {
    return null
  }
  return teamsService.getTeam(teamId)
}
