import type { PageLoad } from './$types'
import { error } from '@sveltejs/kit'
import { getAllGroups } from '$lib/data/groups'
import { getServicesByGroup, getExternalServicesForGroup } from '$lib/data/services'
import { getAllTeams } from '$lib/data/teams'

export const load: PageLoad = async ({ params }) => {
  const { groupId } = params
  if (!groupId) {
    throw error(400, 'Missing group identifier')
  }

  const [groups, services, externalServices, teams] = await Promise.all([
    getAllGroups(),
    getServicesByGroup(groupId),
    getExternalServicesForGroup(groupId),
    getAllTeams()
  ])

  const groupInfo = groups[groupId]
  if (!groupInfo) {
    throw error(404, `Unknown group '${groupId}'`)
  }

  return {
    groupId,
    group: groupInfo,
    groups,
    services,
    externalServices,
    teams
  }
}

