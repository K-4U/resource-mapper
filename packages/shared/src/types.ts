// Validation and parsing functions live in validators.ts

export const ConnectionType = {
  TCP: 'TCP',
  PUBLISHES: 'PUBLISHES',
  CALLS: 'CALLS',
  TRIGGERS: 'TRIGGERS',
  STREAM: 'STREAM',
} as const

export type ConnectionType = typeof ConnectionType[keyof typeof ConnectionType]

export const ServiceType = {
  // Compute
  EC2: 'EC2',
  ECS: 'ECS',
  EKS: 'EKS',
  LAMBDA: 'LAMBDA',
  FARGATE: 'FARGATE',
  BATCH: 'BATCH',
  ELASTIC_BEANSTALK: 'ELASTIC_BEANSTALK',
  APP_RUNNER: 'APP_RUNNER',

  // Containers
  ECR: 'ECR',
  ECS_ANYWHERE: 'ECS_ANYWHERE',
  EKS_ANYWHERE: 'EKS_ANYWHERE',

  // Storage
  S3: 'S3',
  EFS: 'EFS',
  EBS: 'EBS',
  FSX: 'FSX',
  STORAGE_GATEWAY: 'STORAGE_GATEWAY',
  BACKUP: 'BACKUP',
  S3_GLACIER: 'S3_GLACIER',

  // Database
  RDS: 'RDS',
  DYNAMODB: 'DYNAMODB',
  ELASTICACHE: 'ELASTICACHE',
  VALKEY: 'VALKEY',
  AURORA: 'AURORA',
  NEPTUNE: 'NEPTUNE',
  DOCUMENTDB: 'DOCUMENTDB',
  KEYSPACES: 'KEYSPACES',
  TIMESTREAM: 'TIMESTREAM',
  MEMORYDB: 'MEMORYDB',
  QLDB: 'QLDB',

  // Networking & Content Delivery
  VPC: 'VPC',
  CLOUDFRONT: 'CLOUDFRONT',
  ROUTE53: 'ROUTE53',
  API_GATEWAY: 'API_GATEWAY',
  DIRECT_CONNECT: 'DIRECT_CONNECT',
  APP_MESH: 'APP_MESH',
  CLOUD_MAP: 'CLOUD_MAP',
  GLOBAL_ACCELERATOR: 'GLOBAL_ACCELERATOR',

  // Load Balancers
  ALB: 'ALB',
  NLB: 'NLB',
  ELB: 'ELB',
  ELASTIC_LOAD_BALANCING: 'ELASTIC_LOAD_BALANCING',

  // Messaging & Integration
  SQS: 'SQS',
  SNS: 'SNS',
  EVENTBRIDGE: 'EVENTBRIDGE',
  EVENTBRIDGE_RULE: 'EVENTBRIDGE_RULE',
  STEP_FUNCTIONS: 'STEP_FUNCTIONS',
  SWF: 'SWF',
  MQ: 'MQ',
  APPSYNC: 'APPSYNC',

  // Analytics
  KINESIS: 'KINESIS',
  KINESIS_FIREHOSE: 'KINESIS_FIREHOSE',
  KINESIS_ANALYTICS: 'KINESIS_ANALYTICS',
  ATHENA: 'ATHENA',
  EMR: 'EMR',
  GLUE: 'GLUE',
  REDSHIFT: 'REDSHIFT',
  QUICKSIGHT: 'QUICKSIGHT',
  OPENSEARCH: 'OPENSEARCH',
  MSK: 'MSK',

  // Security & Identity
  IAM: 'IAM',
  COGNITO: 'COGNITO',
  SECRETS_MANAGER: 'SECRETS_MANAGER',
  KMS: 'KMS',
  WAF: 'WAF',
  SHIELD: 'SHIELD',
  GUARDDUTY: 'GUARDDUTY',
  INSPECTOR: 'INSPECTOR',
  MACIE: 'MACIE',
  SECURITY_HUB: 'SECURITY_HUB',
  CERTIFICATE_MANAGER: 'CERTIFICATE_MANAGER',
  FIREWALL_MANAGER: 'FIREWALL_MANAGER',
  NETWORK_FIREWALL: 'NETWORK_FIREWALL',

  // Management & Governance
  CLOUDWATCH: 'CLOUDWATCH',
  CLOUDTRAIL: 'CLOUDTRAIL',
  CONFIG: 'CONFIG',
  SYSTEMS_MANAGER: 'SYSTEMS_MANAGER',
  CLOUDFORMATION: 'CLOUDFORMATION',
  ORGANIZATIONS: 'ORGANIZATIONS',
  CONTROL_TOWER: 'CONTROL_TOWER',
  TRUSTED_ADVISOR: 'TRUSTED_ADVISOR',

  // Developer Tools
  CODECOMMIT: 'CODECOMMIT',
  CODEBUILD: 'CODEBUILD',
  CODEDEPLOY: 'CODEDEPLOY',
  CODEPIPELINE: 'CODEPIPELINE',
  CODEARTIFACT: 'CODEARTIFACT',
  CLOUD9: 'CLOUD9',
  X_RAY: 'X_RAY',

  // Machine Learning
  SAGEMAKER: 'SAGEMAKER',
  COMPREHEND: 'COMPREHEND',
  REKOGNITION: 'REKOGNITION',
  TEXTRACT: 'TEXTRACT',
  TRANSLATE: 'TRANSLATE',
  TRANSCRIBE: 'TRANSCRIBE',
  POLLY: 'POLLY',
  LEX: 'LEX',

  // Migration & Transfer
  DMS: 'DMS',
  TRANSFER_FAMILY: 'TRANSFER_FAMILY',
  MIGRATION_HUB: 'MIGRATION_HUB',
  DATASYNC: 'DATASYNC',
  SNOWBALL: 'SNOWBALL',

  // Application Integration
  AMPLIFY: 'AMPLIFY'
}

export type ServiceType = keyof typeof ServiceType

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


