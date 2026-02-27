import type { ServiceDefinition } from '$shared/types'

//TODO: Do you need to exist, or can i put you somewhere else?
export const getServiceNodeIdFromDefinition = (service: ServiceDefinition) =>
  `svc::${service.groupId}::${service.identifier}`