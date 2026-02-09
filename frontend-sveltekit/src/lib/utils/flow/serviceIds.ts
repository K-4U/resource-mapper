import type { ServiceDefinition } from '$lib/types'
import { sanitizeNodeId } from '$lib/utils/flow/helpers'

export const getServiceNodeIdFromDefinition = (service: ServiceDefinition) =>
  sanitizeNodeId(`${service.groupName}_${service.identifier}`, 'svc')

