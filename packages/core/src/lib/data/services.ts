import type { ExternalGroupServices, ServiceDefinition } from '$shared/types'
import bakedData from 'virtual:mapper-data'

export async function getServicesByGroup(groupId: string | null | undefined): Promise<ServiceDefinition[]> {
  if (!groupId) return []
  return (bakedData.servicesByGroup[groupId] as ServiceDefinition[]) || []
}

export async function getExternalServicesForGroup(groupId: string | null | undefined): Promise<ExternalGroupServices[]> {
  if (!groupId) return []
  return (bakedData.externalServices[groupId] as ExternalGroupServices[]) || []
}
