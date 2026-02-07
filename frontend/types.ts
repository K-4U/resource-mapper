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
  VALKEY = 'VALKEY', // Alias for ElastiCache (Redis-compatible)
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
  ALB = 'ALB', // Application Load Balancer
  NLB = 'NLB', // Network Load Balancer
  ELB = 'ELB', // Classic Load Balancer
  ELASTIC_LOAD_BALANCING = 'ELASTIC_LOAD_BALANCING', // Generic
  
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
  MSK = 'MSK', // Managed Streaming for Kafka
  
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
  DMS = 'DMS', // Database Migration Service
  TRANSFER_FAMILY = 'TRANSFER_FAMILY',
  MIGRATION_HUB = 'MIGRATION_HUB',
  DATASYNC = 'DATASYNC',
  SNOWBALL = 'SNOWBALL',
  
  // Application Integration
  AMPLIFY = 'AMPLIFY'
}

// Models matching Java models exactly
export interface ServiceLink {
  connectionType: ConnectionType
  targetIdentifier: string  // Format: 'group/service-id'
  description: string
}

export interface ServiceDefinition {
  friendlyName: string
  description?: string
  serviceType: ServiceType
  identifier: string  // Set from filename by loader
  outgoingConnections?: ServiceLink[]
  incomingConnections?: ServiceLink[]  // Calculated at load time
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
  sourceGroup: string
  targetGroup: string
  connectionCount: number
}

export interface ServiceConnection {
  startService: string
  targetService: string
  connectionType: ConnectionType
  description: string
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