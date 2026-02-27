import type {PageLoad} from './$types'
import {error} from '@sveltejs/kit'
import {getGroup} from '$lib/data/groups'
import {getExternalServicesForGroup, getServicesByGroup} from '$lib/data/services'
import {getAllTeams} from '$lib/data/teams'
import type {GroupInfo} from "$shared/types";
import {getConnectionsFromGroup, getConnectionsToGroup} from "$lib/data/connections";

export const load: PageLoad = async ({params}) => {
    const {groupId} = params
    if (!groupId) {
        throw error(400, 'Missing group identifier')
    }

    const [services, externalServices, teams, connectionsFrom, connectionsTo] = await Promise.all([
        getServicesByGroup(groupId),
        getExternalServicesForGroup(groupId),
        getAllTeams(),
        getConnectionsFromGroup(groupId),
        getConnectionsToGroup(groupId)
    ])

    const groupInfo = await getGroup(groupId);
    if (!groupInfo) {
        throw error(404, `Unknown group '${groupId}'`)
    }

    const allGroups: Map<string, GroupInfo> = new Map();
    allGroups.set(groupInfo.id, groupInfo)

    externalServices.forEach((externalService) => {
        if (!allGroups.has(externalService.group.id)) {
            allGroups.set(externalService.group.id, externalService.group)
        }
    })
    const allConnections = connectionsFrom.concat(connectionsTo);

    return {
        groupId,
        group: groupInfo,
        groups: allGroups,
        connections: allConnections,
        services,
        externalServices,
        teams
    }
}

