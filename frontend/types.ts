// Types exactly matching Java Spring Boot models
// DO NOT DEVIATE from the Spring Boot model structure

// Enums matching Java enums exactly
export enum ConnectionType {
  TCP = 'TCP',
  PUBLISHES = 'PUBLISHES', 
  CALLS = 'CALLS',
  TRIGGERS = 'TRIGGERS'
}

export enum ServiceType {
  VALKEY = 'VALKEY',
  ECS = 'ECS',
  EC2 = 'EC2',
  API_GATEWAY = 'API_GATEWAY',
  ALB = 'ALB',
  NLB = 'NLB',
  RDS = 'RDS',
  ROUTE53 = 'ROUTE53',
  LAMBDA = 'LAMBDA',
  S3 = 'S3',
  SQS = 'SQS',
  SNS = 'SNS',
  DYNAMODB = 'DYNAMODB',
  ELASTICACHE = 'ELASTICACHE',
  CLOUDFRONT = 'CLOUDFRONT',
  EVENTBRIDGE = 'EVENTBRIDGE',
  EVENTBRIDGE_RULE = 'EVENTBRIDGE_RULE',
  KINESIS = 'KINESIS',
  STEP_FUNCTIONS = 'STEP_FUNCTIONS',
  EKS = 'EKS',
  ECR = 'ECR',
  SECRETS_MANAGER = 'SECRETS_MANAGER',
  COGNITO = 'COGNITO'
}

// Models matching Java models exactly
export interface ServiceConnection {
  connectionType: ConnectionType
  targetIdentifier: string  // Format: 'group/service-id'
  description: string
}

export interface ServiceDefinition {
  friendlyName: string
  description?: string
  serviceType: ServiceType
  identifier: string  // Set from filename by loader
  outgoingConnections?: ServiceConnection[]
  incomingConnections?: ServiceConnection[]  // Calculated at load time
  groupName: string  // Set from folder structure by loader
}

export interface GroupInfo {
  name: string
  description?: string
  teamId?: string
  groupName: string  // Set from folder name by loader
}

export interface Team {
  name: string
  description?: string
  teamLead?: string
  email?: string
  slackChannel?: string
  oncallPhone?: string
  teamId: string  // Set from filename by loader
}

export interface GroupConnection {
  groupName: string
  description?: string
  connectedToGroups: Set<string>
  serviceCount: number
}

// Validation functions to ensure YAML matches expected structure
export function validateServiceDefinition(data: any, identifier: string): ServiceDefinition {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid service definition for ${identifier}: must be an object`)
  }

  if (!data.friendlyName || typeof data.friendlyName !== 'string') {
    throw new Error(`Invalid friendlyName for ${identifier}: must be a non-empty string`)
  }

  if (!data.serviceType || !Object.values(ServiceType).includes(data.serviceType)) {
    throw new Error(`Invalid serviceType for ${identifier}: must be one of ${Object.values(ServiceType).join(', ')}`)
  }

  // Validate outgoing connections if present
  if (data.outgoingConnections) {
    if (!Array.isArray(data.outgoingConnections)) {
      throw new Error(`Invalid outgoingConnections for ${identifier}: must be an array`)
    }

    data.outgoingConnections.forEach((conn: any, index: number) => {
      if (!conn.connectionType || !Object.values(ConnectionType).includes(conn.connectionType)) {
        throw new Error(`Invalid connectionType for ${identifier} connection ${index}: must be one of ${Object.values(ConnectionType).join(', ')}`)
      }

      if (!conn.targetIdentifier || typeof conn.targetIdentifier !== 'string' || !conn.targetIdentifier.includes('/')) {
        throw new Error(`Invalid targetIdentifier for ${identifier} connection ${index}: must be in format 'group/service-id'`)
      }

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
    outgoingConnections: data.outgoingConnections?.map((conn: any) => ({
      connectionType: conn.connectionType as ConnectionType,
      targetIdentifier: conn.targetIdentifier,
      description: conn.description
    })),
    incomingConnections: [], // Will be calculated later
    groupName: '' // Will be set by loader
  }
}

export function validateGroupInfo(data: any, groupName: string): GroupInfo {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid group info for ${groupName}: must be an object`)
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new Error(`Invalid name for group ${groupName}: must be a non-empty string`)
  }

  return {
    name: data.name,
    description: data.description,
    teamId: data.teamId,
    groupName: groupName
  }
}

export function validateTeam(data: any, teamId: string): Team {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid team data for ${teamId}: must be an object`)
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new Error(`Invalid name for team ${teamId}: must be a non-empty string`)
  }

  // Validate email format if present
  if (data.email && typeof data.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new Error(`Invalid email for team ${teamId}: must be a valid email address`)
    }
  }

  return {
    name: data.name,
    description: data.description,
    teamLead: data.teamLead,
    email: data.email,
    slackChannel: data.slackChannel,
    oncallPhone: data.oncallPhone,
    teamId: teamId
  }
}