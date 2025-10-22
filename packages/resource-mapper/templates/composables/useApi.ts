import { ref } from 'vue'

// Types matching Java models exactly
export type ConnectionType = 'TCP' | 'PUBLISHES' | 'CALLS' | 'TRIGGERS';

export type ServiceType = 
  | 'VALKEY' | 'ECS' | 'EC2' | 'API_GATEWAY' | 'ALB' | 'NLB' | 'RDS' | 'ROUTE53'
  | 'LAMBDA' | 'S3' | 'SQS' | 'SNS' | 'DYNAMODB' | 'ELASTICACHE' | 'CLOUDFRONT'
  | 'EVENTBRIDGE' | 'EVENTBRIDGE_RULE' | 'KINESIS' | 'STEP_FUNCTIONS'
  | 'EKS' | 'ECR' | 'SECRETS_MANAGER' | 'COGNITO';

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

// Load static data
const servicesData = ref<ServiceDefinition[]>([])
const groupsData = ref<GroupInfo[]>([])
const teamsData = ref<Team[]>([])

let dataLoaded = false

async function loadStaticData() {
  if (dataLoaded) return
  
  try {
    // Use $fetch for both SSR and client-side
    servicesData.value = await $fetch('/data/services.json')
    groupsData.value = await $fetch('/data/groups.json')
    teamsData.value = await $fetch('/data/teams.json')
    
    dataLoaded = true
  } catch (error) {
    console.error('Failed to load static data:', error)
    throw error
  }
}

export const useApi = () => {
  const getAllServices = async () => {
    await loadStaticData()
    return servicesData.value
  }

  const getServicesByGroup = async (groupName: string) => {
    await loadStaticData()
    return servicesData.value.filter(s => s.groupName === groupName)
  }

  const getServiceByIdentifier = async (serviceIdentifier: string) => {
    await loadStaticData()
    return servicesData.value.find(s => `${s.groupName}/${s.identifier}` === serviceIdentifier)
  }

  const getServicesConnectedTo = async (serviceIdentifier: string) => {
    await loadStaticData()
    const service = servicesData.value.find(s => `${s.groupName}/${s.identifier}` === serviceIdentifier)
    if (!service || !service.outgoingConnections) return []
    
    const connectedIds = service.outgoingConnections.map(c => c.targetIdentifier)
    return servicesData.value.filter(s => connectedIds.includes(`${s.groupName}/${s.identifier}`))
  }

  const getAllGroupInfo = async () => {
    await loadStaticData()
    return groupsData.value
  }

  const getGroupInfo = async (groupName: string) => {
    await loadStaticData()
    return groupsData.value.find(g => g.groupName === groupName)
  }

  const getAllGroupConnections = async (): Promise<GroupConnection[]> => {
    await loadStaticData()
    const groupConnections = new Map<string, Set<string>>()
    const serviceCounts = new Map<string, number>()
    
    for (const group of groupsData.value) {
      groupConnections.set(group.groupName, new Set())
      serviceCounts.set(group.groupName, 0)
    }
    
    for (const service of servicesData.value) {
      serviceCounts.set(service.groupName, (serviceCounts.get(service.groupName) || 0) + 1)
      
      if (!service.outgoingConnections) continue
      
      for (const connection of service.outgoingConnections) {
        const [targetGroup] = connection.targetIdentifier.split('/')
        
        if (targetGroup && targetGroup !== service.groupName) {
          groupConnections.get(service.groupName)?.add(targetGroup)
        }
      }
    }
    
    const result: GroupConnection[] = []
    for (const group of groupsData.value) {
      result.push({
        groupName: group.groupName,
        description: group.description,
        connectedToGroups: Array.from(groupConnections.get(group.groupName) || []),
        serviceCount: serviceCounts.get(group.groupName) || 0
      })
    }
    
    return result
  }

  const getTeamById = async (teamId: string) => {
    await loadStaticData()
    return teamsData.value.find(t => t.teamId === teamId)
  }

  const getAllTeams = async () => {
    await loadStaticData()
    return teamsData.value
  }

  return {
    getAllServices,
    getServicesByGroup,
    getServiceByIdentifier,
    getServicesConnectedTo,
    getAllGroupInfo,
    getGroupInfo,
    getAllGroupConnections,
    getTeamById,
    getAllTeams
  }
}
