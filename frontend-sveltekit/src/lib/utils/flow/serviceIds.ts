import type { ServiceDefinition } from '$lib/types'
import { sanitizeNodeId } from '$lib/utils/flow/helpers'

export const getServiceNodeIdFromDefinition = (service: ServiceDefinition) =>
  sanitizeNodeId(`${service.identifier}`, sanitizeNodeId(service.groupName, "svc"))

export const getServiceIdFromNodeId = (nodeId: string) => {
  const parts = nodeId.split('::')
  if (parts.length === 3 && parts[0] === 'svc') {
    return parts[2]
  }
  return null
}