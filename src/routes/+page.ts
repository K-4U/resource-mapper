import type { PageLoad } from './$types'
import { getAllGroups } from '$lib/data/groups'
import { getAllGroupConnections } from '$lib/data/connections'
import { getAllTeams } from '$lib/data/teams'
import {selectedGroup} from "$lib/stores/diagram";

export const load: PageLoad = async () => {
  try {
    console.debug('[overview.load] start fetching data')
    const [groups, groupConnections, teams] = await Promise.all([
      getAllGroups(),
      getAllGroupConnections(),
      getAllTeams()
    ])
    console.debug('[overview.load] data fetched', {
      groups,
      groupConnections,
      teams
    })
    selectedGroup.set(null);
    return { groups, groupConnections, teams }
  } catch (error) {
    console.error('[overview.load] failed to fetch data', error)
    return {
      groups: null,
      groupConnections: null,
      teams: null,
      errorMessage: error instanceof Error ? error.message : 'Failed to load overview data'
    }
  }
}
