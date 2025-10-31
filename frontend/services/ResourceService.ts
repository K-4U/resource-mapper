// Service layer that matches the Spring Boot ResourceService structure
import yaml from 'js-yaml'
import type { 
  ServiceDefinition, 
  GroupInfo, 
  Team, 
  GroupConnection,
  ServiceConnection
} from '~/types'
import { 
  validateServiceDefinition,
  validateGroupInfo,
  validateTeam 
} from '~/types'

class ResourceService {
  private services = new Map<string, ServiceDefinition>()  // key: fullIdentifier (group/service)
  private servicesByGroup = new Map<string, ServiceDefinition[]>()
  private groups = new Map<string, GroupInfo>()
  private teams = new Map<string, Team>()
  private loaded = false

  private async loadYamlFile(path: string) {
    try {
      const response = await fetch(path)
      const text = await response.text()
      return yaml.load(text) as any
    } catch (error) {
      console.warn(`Failed to load ${path}:`, error)
      return null
    }
  }

  private async loadAllData() {
    if (this.loaded) return
    
    console.log('Loading all YAML data...')
    
    // Service groups to load
    //TODO: Dynamically discover groups
    const serviceGroups = ['api', 'compute', 'data', 'frontend']
    
    // Load services from each group
    for (const groupName of serviceGroups) {
      // Load group info
      const groupInfoData = await this.loadYamlFile(`/services/${groupName}/group-info.yaml`)
      if (groupInfoData) {
        try {
          const groupInfo = validateGroupInfo(groupInfoData, groupName)
          this.groups.set(groupName, groupInfo)
        } catch (error) {
          console.error(`Failed to validate group info for ${groupName}:`, error)
        }
      }

      // Load services in this group
      const serviceFiles = await this.discoverServiceFiles(groupName)
      const groupServices: ServiceDefinition[] = []
      
      for (const serviceFile of serviceFiles) {
        const serviceData = await this.loadYamlFile(`/services/${groupName}/${serviceFile}`)
        if (serviceData) {
          try {
            const serviceIdentifier = serviceFile.replace('.yaml', '')
            const service = validateServiceDefinition(serviceData, serviceIdentifier)
            service.groupName = groupName
            service.identifier = serviceIdentifier
            
            const fullIdentifier = `${groupName}/${serviceIdentifier}`
            this.services.set(fullIdentifier, service)
            groupServices.push(service)
          } catch (error) {
            console.error(`Failed to validate service ${serviceFile} in group ${groupName}:`, error)
          }
        }
      }
      
      if (groupServices.length > 0) {
        this.servicesByGroup.set(groupName, groupServices)
      }
    }

    // Load teams
    const teamFiles = ['cloud-shepherds.yaml', 'data-wizards.yaml', 'interface-architects.yaml']
    for (const teamFile of teamFiles) {
      const teamData = await this.loadYamlFile(`/teams/${teamFile}`)
      if (teamData) {
        try {
          const teamId = teamFile.replace('.yaml', '')
          const team = validateTeam(teamData, teamId)
          this.teams.set(teamId, team)
        } catch (error) {
          console.error(`Failed to validate team ${teamFile}:`, error)
        }
      }
    }

    // Calculate incoming connections (matching Java behavior)
    this.calculateIncomingConnections()
    this.loaded = true
    
    console.log(`Loaded ${this.services.size} services across ${this.servicesByGroup.size} groups`)
  }

  private async discoverServiceFiles(groupName: string): Promise<string[]> {
    // Hardcode known service files for now (keeping it simple)
    const knownServices: Record<string, string[]> = {
      api: ['lambda-users.yaml', 'lambda-products.yaml', 'lambda-orders.yaml', 'api-gateway.yaml'],
      compute: ['ecs-inventory.yaml', 'ecs-notification.yaml', 'alb.yaml'],
      data: ['dynamodb-users.yaml', 'dynamodb-products.yaml', 'dynamodb-orders.yaml', 'dynamodb-notifications.yaml', 'rds-postgres.yaml', 'redis.yaml'],
      frontend: ['cloudfront.yaml', 's3-website.yaml', 'route53.yaml']
    }
    
    return knownServices[groupName] || []
  }

  private calculateIncomingConnections() {
    console.log('Calculating incoming connections...')
    
    // Clear existing incoming connections
    this.services.forEach(service => {
      service.incomingConnections = []
    })

    // Calculate incoming connections for each service
    this.services.forEach(service => {
      if (service.outgoingConnections) {
        service.outgoingConnections.forEach(connection => {
          const targetService = this.services.get(connection.targetIdentifier)
          if (targetService) {
            if (!targetService.incomingConnections) {
              targetService.incomingConnections = []
            }
            targetService.incomingConnections.push({
              connectionType: connection.connectionType,
              targetIdentifier: `${service.groupName}/${service.identifier}`,
              description: connection.description
            })
            console.log(`Added incoming connection: ${service.groupName}/${service.identifier} -> ${connection.targetIdentifier}`)
          } else {
            console.warn(`Target service not found: ${connection.targetIdentifier}`)
          }
        })
      }
    })
    
    // Debug: Count total incoming connections
    let totalIncoming = 0
    this.services.forEach(service => {
      totalIncoming += service.incomingConnections?.length || 0
    })
    console.log(`Total incoming connections calculated: ${totalIncoming}`)
  }

  // Calculate incoming connections for a specific group context
  private calculateContextualIncomingConnections(targetGroupName: string, visibleGroups: Set<string>): Map<string, ServiceConnection[]> {
    const contextualIncoming = new Map<string, ServiceConnection[]>()
    
    // Only include incoming connections from visible groups
    visibleGroups.forEach(sourceGroupName => {
      const sourceServices = this.servicesByGroup.get(sourceGroupName) || []
      sourceServices.forEach(sourceService => {
        if (sourceService.outgoingConnections) {
          sourceService.outgoingConnections.forEach(connection => {
            const targetGroup = connection.targetIdentifier.split('/')[0]
            if (targetGroup === targetGroupName) {
              const targetServiceId = connection.targetIdentifier
              if (!contextualIncoming.has(targetServiceId)) {
                contextualIncoming.set(targetServiceId, [])
              }
              contextualIncoming.get(targetServiceId)!.push({
                connectionType: connection.connectionType,
                targetIdentifier: `${sourceService.groupName}/${sourceService.identifier}`,
                description: connection.description
              })
            }
          })
        }
      })
    })
    
    return contextualIncoming
  }

  // Public API methods matching Spring Boot ResourceService

  async getServicesByGroup(groupName: string): Promise<ServiceDefinition[]> {
    await this.loadAllData()
    return this.servicesByGroup.get(groupName) || []
  }

  // Get services for a group with contextual incoming connections
  async getServicesByGroupWithContext(groupName: string, allServices: Record<string, ServiceDefinition[]>): Promise<ServiceDefinition[]> {
    await this.loadAllData()
    const services = this.servicesByGroup.get(groupName) || []
    
    // Determine which groups are visible (current group + groups that connect to it)
    const visibleGroups = new Set<string>([groupName])
    
    // Add groups that have outgoing connections to the current group
    Object.entries(allServices).forEach(([otherGroupName, otherServices]) => {
      if (otherGroupName !== groupName) {
        const hasConnectionToCurrentGroup = otherServices.some(service =>
          service.outgoingConnections?.some(conn =>
            conn.targetIdentifier.split('/')[0] === groupName
          )
        )
        if (hasConnectionToCurrentGroup) {
          visibleGroups.add(otherGroupName)
        }
      }
    })
    
    // Calculate contextual incoming connections
    const contextualIncoming = this.calculateContextualIncomingConnections(groupName, visibleGroups)
    
    // Return services with contextual incoming connections
    return services.map(service => {
      const serviceId = `${service.groupName}/${service.identifier}`
      const contextualIncomingConnections = contextualIncoming.get(serviceId) || []
      
      return {
        ...service,
        incomingConnections: contextualIncomingConnections
      }
    })
  }

  async getAllServices(): Promise<Record<string, ServiceDefinition[]>> {
    await this.loadAllData()
    const result: Record<string, ServiceDefinition[]> = {}
    this.servicesByGroup.forEach((services, groupName) => {
      result[groupName] = services
    })
    return result
  }

  async getGroupInfo(groupName: string): Promise<GroupInfo | null> {
    await this.loadAllData()
    return this.groups.get(groupName) || null
  }

  async getAllGroupInfo(): Promise<Record<string, GroupInfo>> {
    await this.loadAllData()
    const result: Record<string, GroupInfo> = {}
    this.groups.forEach((group, groupName) => {
      result[groupName] = group
    })
    return result
  }

  async getAllGroups(): Promise<GroupInfo[]> {
    await this.loadAllData()
    return Array.from(this.groups.values())
  }

  async getAllTeams(): Promise<Team[]> {
    await this.loadAllData()
    return Array.from(this.teams.values())
  }

  async getTeamById(teamId: string): Promise<Team | null> {
    await this.loadAllData()
    return this.teams.get(teamId) || null
  }

  async getAllGroupConnections(): Promise<GroupConnection[]> {
    await this.loadAllData()
    const allServices = await this.getAllServices()
    const allGroupInfo = await this.getAllGroupInfo()

    return Object.entries(allServices).map(([groupName, services]) => {
      // Find all groups this group connects to
      const connectedToGroups = new Set<string>()
      services.forEach(service => {
        if (service.outgoingConnections) {
          service.outgoingConnections.forEach(connection => {
            const targetGroup = connection.targetIdentifier.split('/')[0]
            if (targetGroup && targetGroup !== groupName) {
              connectedToGroups.add(targetGroup)
            }
          })
        }
      })

      // Get description from GroupInfo if available
      const groupInfo = allGroupInfo[groupName]
      const description = groupInfo?.description

      return {
        groupName,
        description,
        connectedToGroups,
        serviceCount: services.length
      }
    }).sort((a, b) => a.groupName.localeCompare(b.groupName))
  }

  async getServiceByIdentifier(identifier: string): Promise<ServiceDefinition | null> {
    await this.loadAllData()
    return this.services.get(identifier) || null
  }

  async getServicesByTeamId(teamId: string): Promise<ServiceDefinition[]> {
    await this.loadAllData()
    
    // Find all groups managed by this team
    const teamGroups: string[] = []
    this.groups.forEach((group, groupName) => {
      if (group.teamId === teamId) {
        teamGroups.push(groupName)
      }
    })

    // Get all services from those groups
    const result: ServiceDefinition[] = []
    teamGroups.forEach(groupName => {
      const groupServices = this.servicesByGroup.get(groupName) || []
      result.push(...groupServices)
    })
    
    return result
  }

  async getGroupsByTeamId(teamId: string): Promise<GroupInfo[]> {
    await this.loadAllData()
    return Array.from(this.groups.values()).filter(group => group.teamId === teamId)
  }
}

// Export singleton instance
export const resourceService = new ResourceService()