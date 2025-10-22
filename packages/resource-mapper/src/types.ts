// Enums matching Java enums
export type ConnectionType = 'TCP' | 'PUBLISHES' | 'CALLS' | 'TRIGGERS';

export type ServiceType = 
  | 'VALKEY'
  | 'ECS'
  | 'EC2'
  | 'API_GATEWAY'
  | 'ALB'
  | 'NLB'
  | 'RDS'
  | 'ROUTE53'
  | 'LAMBDA'
  | 'S3'
  | 'SQS'
  | 'SNS'
  | 'DYNAMODB'
  | 'ELASTICACHE'
  | 'CLOUDFRONT'
  | 'EVENTBRIDGE'
  | 'EVENTBRIDGE_RULE'
  | 'KINESIS'
  | 'STEP_FUNCTIONS'
  | 'EKS'
  | 'ECR'
  | 'SECRETS_MANAGER'
  | 'COGNITO';

// Models matching Java models exactly
export interface ServiceConnection {
  connectionType: ConnectionType;
  targetIdentifier: string;
  description: string;
}

export interface ServiceDefinition {
  friendlyName: string;
  description?: string;
  serviceType: ServiceType;
  identifier: string;
  outgoingConnections?: ServiceConnection[];
  incomingConnections?: ServiceConnection[];
  groupName: string;
}

export interface GroupInfo {
  name: string;
  description?: string;
  teamId?: string;
  groupName: string;
}

export interface Team {
  name: string;
  description?: string;
  teamLead?: string;
  email?: string;
  slackChannel?: string;
  oncallPhone?: string;
  teamId: string;
}

export interface GroupConnection {
  groupName: string;
  description?: string;
  connectedToGroups: string[];
  serviceCount: number;
}

export interface ResourceMapperConfig {
  title?: string;
  description?: string;
  servicesDir?: string;
  teamsDir?: string;
}

