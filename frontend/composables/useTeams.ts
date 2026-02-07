import { unref, type MaybeRef } from 'vue'
import { useAsyncData } from '#app'
import { teamsService } from '~/services/TeamsService'
import type { Team } from '~/types'

/**
 * Provides the complete team map while hiding service implementation details.
 */
export function useTeams() {
  return useAsyncData<Record<string, Team>>('teams', () => teamsService.getAllTeams())
}

/**
 * Fetches a single team entry keyed by its team identifier.
 */
export function useTeam(teamId: MaybeRef<string | null | undefined>) {
  return useAsyncData<Team | null>(
    () => {
      const id = unref(teamId)
      return id ? `team-${id}` : 'team-null'
    },
    () => {
      const id = unref(teamId)
      if (!id) {
        return Promise.resolve(null)
      }
      return teamsService.getTeam(id)
    },
    {
      watch: [() => unref(teamId)]
    }
  )
}
