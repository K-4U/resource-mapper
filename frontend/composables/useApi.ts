import { resourceService } from '~/services/ResourceService'

export const useApi = () => {
  return {
    getAllServicesGrouped: () => resourceService.getAllGroups(),
    getServicesByGroup: (groupName: string) => resourceService.getServicesByGroup(groupName),
    getServicesByGroupWithContext: async (groupName: string) => {
      const allServices = await resourceService.getAllServices()
      return resourceService.getServicesByGroupWithContext(groupName, allServices)
    },
    getAllServices: () => resourceService.getAllServices(),
    getGroupInfo: (groupName: string) => resourceService.getGroupInfo(groupName),
    getTeams: () => resourceService.getAllTeams(),
    getAllGroupConnections: () => resourceService.getAllGroupConnections(),
    getTeamById: (teamId: string) => resourceService.getTeamById(teamId),
    getServiceByIdentifier: (identifier: string) => resourceService.getServiceByIdentifier(identifier),
    getServicesByTeamId: (teamId: string) => resourceService.getServicesByTeamId(teamId),
    getGroupsByTeamId: (teamId: string) => resourceService.getGroupsByTeamId(teamId),
    getAllGroupInfo: () => resourceService.getAllGroupInfo()
  }
}
