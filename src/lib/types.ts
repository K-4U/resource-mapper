// Types exactly matching Java Spring Boot models
// DO NOT DEVIATE from the Spring Boot model structure

// Enums matching Java enums exactly
export enum ConnectionType {
  TCP = 'TCP',
  PUBLISHES = 'PUBLISHES',
  CALLS = 'CALLS',
  TRIGGERS = 'TRIGGERS',
  STREAM = 'STREAM',
}

export enum ServiceType {
  // Compute
  EC2 = 'EC2',
  ECS = 'ECS',
  EKS = 'EKS',
  LAMBDA = 'LAMBDA',
  FARGATE = 'FARGATE',
  BATCH = 'BATCH',
  ELASTIC_BEANSTALK = 'ELASTIC_BEANSTALK',
  APP_RUNNER = 'APP_RUNNER',

  // Containers
  ECR = 'ECR',
  ECS_ANYWHERE = 'ECS_ANYWHERE',
  EKS_ANYWHERE = 'EKS_ANYWHERE',

  // Storage
  S3 = 'S3',
  EFS = 'EFS',
  EBS = 'EBS',
  FSX = 'FSX',
  STORAGE_GATEWAY = 'STORAGE_GATEWAY',
  BACKUP = 'BACKUP',
  S3_GLACIER = 'S3_GLACIER',

  // Database
  RDS = 'RDS',
  DYNAMODB = 'DYNAMODB',
  ELASTICACHE = 'ELASTICACHE',
  VALKEY = 'VALKEY',
  AURORA = 'AURORA',
  NEPTUNE = 'NEPTUNE',
  DOCUMENTDB = 'DOCUMENTDB',
  KEYSPACES = 'KEYSPACES',
  TIMESTREAM = 'TIMESTREAM',
  MEMORYDB = 'MEMORYDB',
  QLDB = 'QLDB',

  // Networking & Content Delivery
  VPC = 'VPC',
  CLOUDFRONT = 'CLOUDFRONT',
  ROUTE53 = 'ROUTE53',
  API_GATEWAY = 'API_GATEWAY',
  DIRECT_CONNECT = 'DIRECT_CONNECT',
  APP_MESH = 'APP_MESH',
  CLOUD_MAP = 'CLOUD_MAP',
  GLOBAL_ACCELERATOR = 'GLOBAL_ACCELERATOR',

  // Load Balancers
  ALB = 'ALB',
  NLB = 'NLB',
  ELB = 'ELB',
  ELASTIC_LOAD_BALANCING = 'ELASTIC_LOAD_BALANCING',

  // Messaging & Integration
  SQS = 'SQS',
  SNS = 'SNS',
  EVENTBRIDGE = 'EVENTBRIDGE',
  EVENTBRIDGE_RULE = 'EVENTBRIDGE_RULE',
  STEP_FUNCTIONS = 'STEP_FUNCTIONS',
  SWF = 'SWF',
  MQ = 'MQ',
  APPSYNC = 'APPSYNC',

  // Analytics
  KINESIS = 'KINESIS',
  KINESIS_FIREHOSE = 'KINESIS_FIREHOSE',
  KINESIS_ANALYTICS = 'KINESIS_ANALYTICS',
  ATHENA = 'ATHENA',
  EMR = 'EMR',
  GLUE = 'GLUE',
  REDSHIFT = 'REDSHIFT',
  QUICKSIGHT = 'QUICKSIGHT',
  OPENSEARCH = 'OPENSEARCH',
  MSK = 'MSK',

  // Security & Identity
  IAM = 'IAM',
  COGNITO = 'COGNITO',
  SECRETS_MANAGER = 'SECRETS_MANAGER',
  KMS = 'KMS',
  WAF = 'WAF',
  SHIELD = 'SHIELD',
  GUARDDUTY = 'GUARDDUTY',
  INSPECTOR = 'INSPECTOR',
  MACIE = 'MACIE',
  SECURITY_HUB = 'SECURITY_HUB',
  CERTIFICATE_MANAGER = 'CERTIFICATE_MANAGER',
  FIREWALL_MANAGER = 'FIREWALL_MANAGER',
  NETWORK_FIREWALL = 'NETWORK_FIREWALL',

  // Management & Governance
  CLOUDWATCH = 'CLOUDWATCH',
  CLOUDTRAIL = 'CLOUDTRAIL',
  CONFIG = 'CONFIG',
  SYSTEMS_MANAGER = 'SYSTEMS_MANAGER',
  CLOUDFORMATION = 'CLOUDFORMATION',
  ORGANIZATIONS = 'ORGANIZATIONS',
  CONTROL_TOWER = 'CONTROL_TOWER',
  TRUSTED_ADVISOR = 'TRUSTED_ADVISOR',

  // Developer Tools
  CODECOMMIT = 'CODECOMMIT',
  CODEBUILD = 'CODEBUILD',
  CODEDEPLOY = 'CODEDEPLOY',
  CODEPIPELINE = 'CODEPIPELINE',
  CODEARTIFACT = 'CODEARTIFACT',
  CLOUD9 = 'CLOUD9',
  X_RAY = 'X_RAY',

  // Machine Learning
  SAGEMAKER = 'SAGEMAKER',
  COMPREHEND = 'COMPREHEND',
  REKOGNITION = 'REKOGNITION',
  TEXTRACT = 'TEXTRACT',
  TRANSLATE = 'TRANSLATE',
  TRANSCRIBE = 'TRANSCRIBE',
  POLLY = 'POLLY',
  LEX = 'LEX',

  // Migration & Transfer
  DMS = 'DMS',
  TRANSFER_FAMILY = 'TRANSFER_FAMILY',
  MIGRATION_HUB = 'MIGRATION_HUB',
  DATASYNC = 'DATASYNC',
  SNOWBALL = 'SNOWBALL',

  // Application Integration
  AMPLIFY = 'AMPLIFY'
}

export interface ServiceLink {
  connectionType: ConnectionType
  targetIdentifier: ServiceIdentifier
  description: string
}

export interface ServiceIdentifier {
  groupId: string
  serviceId: string
}

export interface ServiceDefinition {
  friendlyName: string
  description?: string
  serviceType: ServiceType
  identifier: string
  outgoingConnections?: ServiceLink[]
  incomingConnections?: ServiceIncomingLink[]
  groupId: string
}

export const TEAM_REACH_CHANNELS = [
  'email',
  'slack',
  'phone',
  'teams',
  'pigeon',
  'sms',
  'web',
  'pagerduty'
] as const

export type TeamReachChannel = typeof TEAM_REACH_CHANNELS[number]

export interface TeamReachOption {
  channel: TeamReachChannel
  detail: string
}

export type ExternalConnectionDirection = 'incoming' | 'outgoing'

export interface ServiceIncomingLink {
  connectionType: ConnectionType
  sourceIdentifier: ServiceIdentifier
  description: string
}

export interface ExternalGroupServices {
  group: GroupInfo
  services: ServiceDefinition[]
  direction: ExternalConnectionDirection
}

export interface GroupInfo {
  id: string,
  name: string
  description?: string
  teamId?: string
  groupName: string
}

export interface Team {
  name: string
  description?: string
  teamLead?: string
  teamId: string
  reachability?: TeamReachOption[]
}

export interface GroupConnection {
  sourceGroup: string
  targetGroup: string
  connectionCount: number
}

export interface ServiceConnection {
  startService: ServiceIdentifier
  targetService: ServiceIdentifier
  connectionType: ConnectionType
  description: string
}

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

  if (!data.serviceType || !Object.values(ServiceType).includes(data.serviceType)) {
    throw new Error(`Invalid serviceType for ${identifier}: must be one of ${Object.values(ServiceType).join(', ')}`)
  }

  if (data.outgoingConnections) {
    if (!Array.isArray(data.outgoingConnections)) {
      throw new Error(`Invalid outgoingConnections for ${identifier}: must be an array`)
    }

    data.outgoingConnections.forEach((conn: any, index: number) => {
      if (!conn.connectionType || !Object.values(ConnectionType).includes(conn.connectionType)) {
        throw new Error(`Invalid connectionType for ${identifier} connection ${index}: must be one of ${Object.values(ConnectionType).join(', ')}`)
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
      if (!TEAM_REACH_CHANNELS.includes(channel as TeamReachChannel)) {
        throw new Error(
          `Invalid reachability channel '${channel}' for team ${teamId} entry #${index}: ` +
          `allowed channels are ${TEAM_REACH_CHANNELS.join(', ')}`
        )
      }
      if (!contact.detail || typeof contact.detail !== 'string') {
        throw new Error(`Invalid reachability detail for team ${teamId} entry #${index}: must be a non-empty string`)
      }
      reachability.push({ channel: channel as TeamReachChannel, detail: contact.detail })
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

