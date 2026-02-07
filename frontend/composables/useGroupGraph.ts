import type { GroupConnection, ServiceDefinition } from '~/types'
import { ServiceType } from '~/types'

export interface DiagramNodeMeta {
  id: string
  type: 'group' | 'external-group' | 'service' | 'external-service'
  groupName: string
  label: string
  service?: ServiceDefinition
  isIncomingOnly?: boolean
}

export interface DiagramBuildResult {
  definition: string
  nodeMeta: Record<string, DiagramNodeMeta>
  stats: {
    edgeCount: number
    serviceCount: number
    externalGroupCount: number
  }
}

class MermaidIdRegistry {
  private readonly used = new Set<string>()

  public getId(base: string): string {
    const sanitized = base.replace(/[^a-zA-Z0-9_]/g, '_') || 'node'
    let candidate = sanitized
    let counter = 1
    while (this.used.has(candidate)) {
      candidate = `${sanitized}_${counter++}`
    }
    this.used.add(candidate)
    return candidate
  }
}

function escapeLabel(label: string): string {
  return label.replace(/"/g, '\\"')
}

function formatGroupName(name: string): string {
  if (!name) return 'Group'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const DEFAULT_GROUP_ICON = 'cloud'
const DEFAULT_EXTERNAL_GROUP_ICON = 'internet'
const DEFAULT_SERVICE_ICON = 'server'
const DEFAULT_STORAGE_ICON = 'disk'
const DEFAULT_DATABASE_ICON = 'database'

const SERVICE_ICON_MAP: Partial<Record<ServiceType, string>> = {
  [ServiceType.RDS]: DEFAULT_DATABASE_ICON,
  [ServiceType.AURORA]: DEFAULT_DATABASE_ICON,
  [ServiceType.DYNAMODB]: DEFAULT_DATABASE_ICON,
  [ServiceType.NEPTUNE]: DEFAULT_DATABASE_ICON,
  [ServiceType.DOCUMENTDB]: DEFAULT_DATABASE_ICON,
  [ServiceType.QLDB]: DEFAULT_DATABASE_ICON,
  [ServiceType.TIMESTREAM]: DEFAULT_DATABASE_ICON,
  [ServiceType.KEYSPACES]: DEFAULT_DATABASE_ICON,
  [ServiceType.MEMORYDB]: DEFAULT_DATABASE_ICON,
  [ServiceType.VALKEY]: DEFAULT_DATABASE_ICON,
  [ServiceType.ELASTICACHE]: DEFAULT_DATABASE_ICON,

  [ServiceType.S3]: DEFAULT_STORAGE_ICON,
  [ServiceType.S3_GLACIER]: DEFAULT_STORAGE_ICON,
  [ServiceType.EFS]: DEFAULT_STORAGE_ICON,
  [ServiceType.EBS]: DEFAULT_STORAGE_ICON,
  [ServiceType.FSX]: DEFAULT_STORAGE_ICON,
  [ServiceType.STORAGE_GATEWAY]: DEFAULT_STORAGE_ICON,
  [ServiceType.BACKUP]: DEFAULT_STORAGE_ICON,

  [ServiceType.EC2]: DEFAULT_SERVICE_ICON,
  [ServiceType.ECS]: DEFAULT_SERVICE_ICON,
  [ServiceType.EKS]: DEFAULT_SERVICE_ICON,
  [ServiceType.LAMBDA]: DEFAULT_SERVICE_ICON,
  [ServiceType.FARGATE]: DEFAULT_SERVICE_ICON,
  [ServiceType.APP_RUNNER]: DEFAULT_SERVICE_ICON,
  [ServiceType.BATCH]: DEFAULT_SERVICE_ICON,

  [ServiceType.API_GATEWAY]: DEFAULT_GROUP_ICON,
  [ServiceType.CLOUDFRONT]: DEFAULT_GROUP_ICON,
  [ServiceType.ROUTE53]: DEFAULT_GROUP_ICON,
  [ServiceType.VPC]: DEFAULT_GROUP_ICON,
  [ServiceType.GLOBAL_ACCELERATOR]: DEFAULT_GROUP_ICON,

  [ServiceType.AMPLIFY]: DEFAULT_GROUP_ICON,
  [ServiceType.CLOUDFORMATION]: DEFAULT_GROUP_ICON,
  [ServiceType.STEP_FUNCTIONS]: DEFAULT_GROUP_ICON,
  [ServiceType.SQS]: DEFAULT_GROUP_ICON,
  [ServiceType.SNS]: DEFAULT_GROUP_ICON,
  [ServiceType.EVENTBRIDGE]: DEFAULT_GROUP_ICON,
  [ServiceType.EVENTBRIDGE_RULE]: DEFAULT_GROUP_ICON,
  [ServiceType.CODEPIPELINE]: DEFAULT_GROUP_ICON,
  [ServiceType.CODEBUILD]: DEFAULT_GROUP_ICON,
  [ServiceType.CODEDEPLOY]: DEFAULT_GROUP_ICON,
  [ServiceType.CODECOMMIT]: DEFAULT_GROUP_ICON,
  [ServiceType.CODEARTIFACT]: DEFAULT_GROUP_ICON,
  [ServiceType.CLOUDWATCH]: DEFAULT_GROUP_ICON,
  [ServiceType.CLOUDTRAIL]: DEFAULT_GROUP_ICON,
  [ServiceType.CONFIG]: DEFAULT_GROUP_ICON,
  [ServiceType.SYSTEMS_MANAGER]: DEFAULT_GROUP_ICON,
  [ServiceType.SECRETS_MANAGER]: DEFAULT_GROUP_ICON,
  [ServiceType.KMS]: DEFAULT_GROUP_ICON,
  [ServiceType.IAM]: DEFAULT_GROUP_ICON,
  [ServiceType.COGNITO]: DEFAULT_GROUP_ICON,
  [ServiceType.SAGEMAKER]: DEFAULT_GROUP_ICON,
  [ServiceType.KINESIS]: DEFAULT_GROUP_ICON,
  [ServiceType.KINESIS_FIREHOSE]: DEFAULT_GROUP_ICON,
  [ServiceType.KINESIS_ANALYTICS]: DEFAULT_GROUP_ICON,
  [ServiceType.ATHENA]: DEFAULT_GROUP_ICON,
  [ServiceType.EMR]: DEFAULT_GROUP_ICON,
  [ServiceType.GLUE]: DEFAULT_GROUP_ICON,
  [ServiceType.REDSHIFT]: DEFAULT_GROUP_ICON,
  [ServiceType.QUICKSIGHT]: DEFAULT_GROUP_ICON,
  [ServiceType.OPENSEARCH]: DEFAULT_GROUP_ICON,
  [ServiceType.MSK]: DEFAULT_GROUP_ICON
}

function resolveServiceIcon(service: ServiceDefinition): string {
  return SERVICE_ICON_MAP[service.serviceType] || DEFAULT_SERVICE_ICON
}

function buildSelectionStyle(nodeId: string): string {
  return `style ${nodeId} stroke:#E040FB,stroke-width:3px`
}

export function useGroupGraph() {
  function buildGraph(
    services: ServiceDefinition[],
    allServices: Record<string, ServiceDefinition[]>,
    groupName: string,
    capitalizedGroupName: string,
    hideIncomingConnections = false,
    hideExternalToExternal = false,
    selectedNodeId?: string | null
  ): DiagramBuildResult {
    const registry = new MermaidIdRegistry()
    const nodeMeta: Record<string, DiagramNodeMeta> = {}
    const lines: string[] = ['architecture-beta']
    const edgeDefinitions: string[] = []
    const styleDirectives: string[] = []
    const serviceNodeIds = new Map<string, string>()
    const externalServiceNodeIds = new Map<string, string>()
    const externalGroups = new Map<string, string>()

    const stats = {
      edgeCount: 0,
      serviceCount: 0,
      externalGroupCount: 0
    }

    const serviceLookup = new Map<string, ServiceDefinition>()
    Object.values(allServices).forEach(groupList => {
      groupList.forEach(service => {
        const id = `${service.groupName}/${service.identifier}`
        serviceLookup.set(id, service)
      })
    })

    const outgoingTargets = new Set<string>()
    const incomingSources = new Set<string>()

    services.forEach(service => {
      service.outgoingConnections?.forEach(connection => {
        outgoingTargets.add(connection.targetIdentifier)
      })
      service.incomingConnections?.forEach(connection => {
        incomingSources.add(connection.targetIdentifier)
      })
    })

    const visibleServices = hideIncomingConnections
      ? services.filter(service => {
          const fullId = `${service.groupName}/${service.identifier}`
          const hasOutgoing = (service.outgoingConnections?.length || 0) > 0
          const hasIncoming = incomingSources.has(fullId)
          if (hasIncoming && !hasOutgoing) {
            return false
          }
          return true
        })
      : services

    const mainGroupId = registry.getId(`group_${groupName}`)
    lines.push(`group ${mainGroupId}(${DEFAULT_GROUP_ICON})[${escapeLabel(capitalizedGroupName)}]`)
    nodeMeta[mainGroupId] = {
      id: mainGroupId,
      type: 'group',
      groupName,
      label: capitalizedGroupName
    }

    visibleServices.forEach(service => {
      const fullId = `${service.groupName}/${service.identifier}`
      const nodeId = registry.getId(`service_${service.groupName}_${service.identifier}`)
      const label = escapeLabel(service.friendlyName || service.identifier)
      const icon = resolveServiceIcon(service)
      lines.push(`  service ${nodeId}(${icon})["${label}"] in ${mainGroupId}`)
      nodeMeta[nodeId] = {
        id: nodeId,
        type: 'service',
        groupName: service.groupName,
        label: service.friendlyName || service.identifier,
        service
      }
      serviceNodeIds.set(fullId, nodeId)
      stats.serviceCount += 1
    })

    function ensureExternalGroup(targetGroupName: string): string {
      if (externalGroups.has(targetGroupName)) {
        return externalGroups.get(targetGroupName)!
      }
      const groupId = registry.getId(`group_${targetGroupName}`)
      const label = escapeLabel(formatGroupName(targetGroupName))
      lines.push(`group ${groupId}(${DEFAULT_EXTERNAL_GROUP_ICON})[${label}]`)
      nodeMeta[groupId] = {
        id: groupId,
        type: 'external-group',
        groupName: targetGroupName,
        label: formatGroupName(targetGroupName)
      }
      externalGroups.set(targetGroupName, groupId)
      return groupId
    }

    function ensureExternalServiceNode(fullId: string): string | null {
      if (externalServiceNodeIds.has(fullId)) {
        return externalServiceNodeIds.get(fullId)!
      }

      const service = serviceLookup.get(fullId)
      if (!service) {
        return null
      }
      if (service.groupName === groupName) {
        return serviceNodeIds.get(fullId) || null
      }

      const isIncomingOnly = incomingSources.has(fullId) && !outgoingTargets.has(fullId)
      if (hideIncomingConnections && isIncomingOnly) {
        return null
      }

      const externalGroupId = ensureExternalGroup(service.groupName)
      const nodeId = registry.getId(`service_${service.groupName}_${service.identifier}`)
      const label = escapeLabel(service.friendlyName || service.identifier)
      const icon = resolveServiceIcon(service)
      lines.push(`  service ${nodeId}(${icon})["${label}"] in ${externalGroupId}`)
      nodeMeta[nodeId] = {
        id: nodeId,
        type: 'external-service',
        groupName: service.groupName,
        label: service.friendlyName || service.identifier,
        service,
        isIncomingOnly
      }
      externalServiceNodeIds.set(fullId, nodeId)
      return nodeId
    }

    function addEdge(sourceId: string, targetId: string, label?: string) {
      const sourceMeta = nodeMeta[sourceId]
      const targetMeta = nodeMeta[targetId]
      if (!sourceMeta || !targetMeta) {
        return
      }
      const sourceExternal = sourceMeta.type === 'external-service' || sourceMeta.type === 'external-group'
      const targetExternal = targetMeta.type === 'external-service' || targetMeta.type === 'external-group'
      if (hideExternalToExternal && sourceExternal && targetExternal) {
        return
      }
      const labelSegment = label ? `|${escapeLabel(label)}|` : ''
      const connector = labelSegment ? ` -->${labelSegment} ` : ' --> '
      edgeDefinitions.push(`  ${sourceId}:R${connector}L:${targetId}`)
      stats.edgeCount += 1
    }

    visibleServices.forEach(service => {
      const sourceNodeId = serviceNodeIds.get(`${service.groupName}/${service.identifier}`)
      if (!sourceNodeId) {
        return
      }

      service.outgoingConnections?.forEach(connection => {
        const targetNodeId = ensureExternalServiceNode(connection.targetIdentifier)
          ?? serviceNodeIds.get(connection.targetIdentifier)
        if (targetNodeId) {
          addEdge(sourceNodeId, targetNodeId, connection.connectionType)
        }
      })

      if (!hideIncomingConnections) {
        service.incomingConnections?.forEach(connection => {
          const externalNodeId = ensureExternalServiceNode(connection.targetIdentifier)
          if (!externalNodeId) {
            return
          }
          addEdge(externalNodeId, sourceNodeId, connection.connectionType)
        })
      }
    })

    stats.externalGroupCount = externalGroups.size

    if (selectedNodeId && nodeMeta[selectedNodeId]) {
      styleDirectives.push(buildSelectionStyle(selectedNodeId))
    }

    return {
      definition: [...lines, ...edgeDefinitions, ...styleDirectives].join('\n'),
      nodeMeta,
      stats
    }
  }

  function buildGraphFromConnections(
    groupConnections: GroupConnection[],
    selectedNodeId?: string | null
  ): DiagramBuildResult {
    const registry = new MermaidIdRegistry()
    const nodeMeta: Record<string, DiagramNodeMeta> = {}
    const lines: string[] = ['graph TD']
    const edgeDefinitions: string[] = []
    const styleDirectives: string[] = []

    const stats = {
      edgeCount: 0,
      serviceCount: 0,
      externalGroupCount: 0
    }

    const groupNodeIds = new Map<string, string>()

    groupConnections.forEach(group => {
      const nodeId = registry.getId(`group_${group.groupName}`)
      const label = escapeLabel(formatGroupName(group.groupName))
      lines.push(`  ${nodeId}["${label}"]`)
      nodeMeta[nodeId] = {
        id: nodeId,
        type: 'group',
        groupName: group.groupName,
        label: formatGroupName(group.groupName)
      }
      groupNodeIds.set(group.groupName, nodeId)
    })

    groupConnections.forEach(group => {
      const sourceId = groupNodeIds.get(group.groupName)
      if (!sourceId) {
        return
      }
      group.connectedToGroups?.forEach(target => {
        const targetId = groupNodeIds.get(target)
        if (!targetId) {
          return
        }
        edgeDefinitions.push(`  ${sourceId} --> ${targetId}`)
        stats.edgeCount += 1
      })
    })

    if (selectedNodeId && nodeMeta[selectedNodeId]) {
      styleDirectives.push(buildSelectionStyle(selectedNodeId))
    }

    return {
      definition: [...lines, ...edgeDefinitions, ...styleDirectives].join('\n'),
      nodeMeta,
      stats
    }
  }

  return {
    buildGraph,
    buildGraphFromConnections
  }
}
