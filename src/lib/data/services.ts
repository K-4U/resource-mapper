import type { ExternalGroupServices, ServiceDefinition } from '$lib/types'
import { servicesService } from '$lib/services/ServicesService'

export async function getServicesByGroup(groupId: string | null | undefined): Promise<ServiceDefinition[]> {
  console.debug('[data/services] getServicesByGroup called', groupId)
  if (!groupId) {
    return []
  }
  const result = await servicesService.getServicesByGroup(groupId)
  console.debug('[data/services] getServicesByGroup result', { groupId, count: result.length })
  return result
}

export async function getExternalServicesForGroup(groupId: string | null | undefined): Promise<ExternalGroupServices[]> {
  console.debug('[data/services] getExternalServicesForGroup called', groupId)
  if (!groupId) {
    return []
  }
  const result = await servicesService.getExternalServicesForGroup(groupId)
  console.debug('[data/services] getExternalServicesForGroup result', { groupId, count: result.length })
  return result
}
