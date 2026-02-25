import type { Team } from '$lib/types'
import bakedData from '$lib/generated/data.json'

export async function getAllTeams(): Promise<Record<string, Team>> {
  return bakedData.teams as Record<string, Team>;
}

export async function getTeam(teamId: string | null | undefined): Promise<Team | null> {
  if (!teamId) return null;
  return (bakedData.teams[teamId] as Team) ?? null;
}
