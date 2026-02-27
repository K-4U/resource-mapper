import type { Team } from '$shared/types'
import bakedData from 'virtual:mapper-data'

export async function getAllTeams(): Promise<Record<string, Team>> {
  return bakedData.teams as Record<string, Team>;
}

export async function getTeam(teamId: string | null | undefined): Promise<Team | null> {
  if (!teamId) return null;
  return (bakedData.teams[teamId] as Team) ?? null;
}
