import type {
  ConnectionType,
  GroupInfo,
  ServiceDefinition,
  ServiceIdentifier,
  ServiceType,
  Team,
  TeamReachOption,
} from './types.js'
import {
  ConnectionType as ConnectionTypeEnum,
  ServiceType as ServiceTypeEnum,
  TEAM_REACH_CHANNELS,
} from './types.js'

export function parseServiceIdentifier(value: unknown, contextLabel: string): ServiceIdentifier {
  if (typeof value === 'string') {
    if (value.includes('{') || value.includes('}')) {
      throw new Error(`Invalid targetIdentifier for ${contextLabel}: legacy 'service{group}' format is not supported`)
    }
    const [groupId, serviceId] = value.split('/')
    if (!groupId || !serviceId) {
      throw new Error(`Invalid targetIdentifier for ${contextLabel}: must be in format 'group/service-id'`)
    }
    return { groupId, serviceId }
  }
  if (value && typeof value === 'object') {
    const maybe = value as Partial<ServiceIdentifier>
    if (typeof maybe.groupId === 'string' && maybe.groupId && typeof maybe.serviceId === 'string' && maybe.serviceId) {
      return { groupId: maybe.groupId, serviceId: maybe.serviceId }
    }
  }
  throw new Error(`Invalid targetIdentifier for ${contextLabel}: must be a string 'group/service' or an object with groupId and serviceId`)
}

export function validateServiceDefinition(data: any, identifier: string): ServiceDefinition {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid service definition for ${identifier}: must be an object`)
  }

  if (!data.friendlyName || typeof data.friendlyName !== 'string') {
    throw new Error(`Invalid friendlyName for ${identifier}: must be a non-empty string`)
  }

  if (!data.serviceType || !Object.values(ServiceTypeEnum).includes(data.serviceType)) {
    throw new Error(`Invalid serviceType for ${identifier}: must be one of ${Object.values(ServiceTypeEnum).join(', ')}`)
  }

  if (data.outgoingConnections) {
    if (!Array.isArray(data.outgoingConnections)) {
      throw new Error(`Invalid outgoingConnections for ${identifier}: must be an array`)
    }

    data.outgoingConnections.forEach((conn: any, index: number) => {
      if (!conn.connectionType || !Object.values(ConnectionTypeEnum).includes(conn.connectionType)) {
        throw new Error(`Invalid connectionType for ${identifier} connection ${index}: must be one of ${Object.values(ConnectionTypeEnum).join(', ')}`)
      }

      parseServiceIdentifier(conn.targetIdentifier, `${identifier} connection ${index}`)

      if (!conn.description || typeof conn.description !== 'string') {
        throw new Error(`Invalid description for ${identifier} connection ${index}: must be a non-empty string`)
      }
    })
  }

  return {
    friendlyName: data.friendlyName,
    description: data.description,
    serviceType: data.serviceType as ServiceType,
    identifier: identifier,
    outgoingConnections: data.outgoingConnections?.map((conn: any, index: number) => ({
      connectionType: conn.connectionType as ConnectionType,
      targetIdentifier: parseServiceIdentifier(conn.targetIdentifier, `${identifier} connection ${index}`),
      description: conn.description
    })),
    incomingConnections: [],
    groupId: ''
  }
}

export function validateGroupInfo(data: any, groupId: string): GroupInfo {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid group info for ${groupId}: must be an object`)
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new Error(`Invalid name for group ${groupId}: must be a non-empty string`)
  }

  return {
    id: groupId,
    name: data.name,
    description: data.description,
    teamId: data.teamId,
    groupName: groupId
  }
}

export function validateTeam(data: any, teamId: string): Team {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid team data for ${teamId}: must be an object`)
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new Error(`Invalid name for team ${teamId}: must be a non-empty string`)
  }

  const reachability: TeamReachOption[] = []

  if (Array.isArray(data.reachability)) {
    data.reachability.forEach((contact: any, index: number) => {
      if (!contact || typeof contact !== 'object') {
        throw new Error(`Invalid reachability entry #${index} for team ${teamId}: must be an object`)
      }
      if (!contact.channel || typeof contact.channel !== 'string') {
        throw new Error(`Invalid reachability channel for team ${teamId} entry #${index}: must be a non-empty string`)
      }
      const channel = contact.channel as string
      if (!TEAM_REACH_CHANNELS.includes(channel as any)) {
        throw new Error(
          `Invalid reachability channel '${channel}' for team ${teamId} entry #${index}: ` +
          `allowed channels are ${TEAM_REACH_CHANNELS.join(', ')}`
        )
      }
      if (!contact.detail || typeof contact.detail !== 'string') {
        throw new Error(`Invalid reachability detail for team ${teamId} entry #${index}: must be a non-empty string`)
      }
      reachability.push({ channel: channel as any, detail: contact.detail })
    })
  }

  return {
    name: data.name,
    description: data.description,
    teamLead: data.teamLead,
    reachability,
    teamId: teamId
  }
}


