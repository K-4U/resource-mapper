import type {
  ConnectionType,
  ExternalConnectionDirection,
  ExternalGroupServices,
  GroupInfo,
  ServiceDefinition
} from '$lib/types'
import type { FlowGraphInput, GroupServicesGraphResult, RawFlowEdge, RawFlowNode } from '$lib/utils/flow/types'
import { createGraphSignature, edgeColorForConnection } from '$lib/utils/flow/helpers'
import { getServiceNodeIdFromDefinition } from '$lib/utils/flow/serviceIds'
import { getAwsIconPath } from '$lib/utils/awsIcons'

interface ExternalNodeMeta {
  direction: ExternalConnectionDirection
  group: GroupInfo
  service: ServiceDefinition
}

export function buildGroupServicesGraph(
  group: GroupInfo,
  services: ServiceDefinition[],
  externalGroups: ExternalGroupServices[] = []
): GroupServicesGraphResult {
  const nodes: RawFlowNode[] = []
  const edges: RawFlowEdge[] = []
  const serviceNodeLookup = new Map<string, string>()
  const externalNodeMap = new Map<string, RawFlowNode>()
  const serviceNodeRecord: Record<string, ServiceDefinition> = {}
  const externalNodeRecord: Record<string, { service: ServiceDefinition; group: GroupInfo }> = {}

  if (!services.length) {
    nodes.push({
      id: `placeholder_${group.groupName}`,
      width: 240,
      height: 120,
      data: {
        label: 'No services defined',
        subLabel: 'Add services to see relationships',
        kind: 'service',
        groupId: group.groupName,
        isPlaceholder: true
      }
    })
    return {
      graph: {
        nodes,
        edges,
        signature: createGraphSignature('group-services', { group: group.groupName, placeholder: true })
      },
      serviceNodes: serviceNodeRecord,
      externalNodes: externalNodeRecord
    }
  }

  services.forEach(service => {
    const nodeId = getServiceNodeIdFromDefinition(service)
    serviceNodeLookup.set(service.identifier, nodeId)
    serviceNodeRecord[nodeId] = service
    nodes.push({
      id: nodeId,
      width: 240,
      height: 140,
      data: {
        label: service.friendlyName,
        subLabel: service.description ?? undefined,
        iconPath: getAwsIconPath(service.serviceType),
        groupId: group.groupName,
        serviceId: service.identifier,
        kind: 'service'
      }
    })
  })

  const outgoingLookup = createDirectionLookup(externalGroups, 'outgoing')
  const incomingLookup = createDirectionLookup(externalGroups, 'incoming')

  services.forEach(service => {
    const sourceId = serviceNodeLookup.get(service.identifier)
    if (!sourceId) return

    service.outgoingConnections?.forEach(connection => {
      const target = connection.targetIdentifier
      if (target.groupId === group.groupName) {
        const targetId = target.serviceId ? serviceNodeLookup.get(target.serviceId) : undefined
        if (!targetId) return
        edges.push(buildEdge(sourceId, targetId, connection.connectionType))
        return
      }

      if (!target.groupId || !target.serviceId) {
        return
      }
      const externalTarget = ensureExternalNode(
        'outgoing',
        target.groupId,
        target.serviceId,
        outgoingLookup,
        externalNodeMap,
        externalNodeRecord
      )
      if (!externalTarget) return
      edges.push(buildEdge(sourceId, externalTarget, connection.connectionType, 'outgoing'))
    })

    service.incomingConnections?.forEach(connection => {
      const source = connection.sourceIdentifier
      if (source.groupId === group.groupName) {
        const sourceNodeId = source.serviceId ? serviceNodeLookup.get(source.serviceId) : undefined
        if (!sourceNodeId) return
        const targetNodeId = serviceNodeLookup.get(service.identifier)
        if (!targetNodeId) return
        edges.push(buildEdge(sourceNodeId, targetNodeId, connection.connectionType))
        return
      }

      if (!source.groupId || !source.serviceId) {
        return
      }
      const externalSource = ensureExternalNode(
        'incoming',
        source.groupId,
        source.serviceId,
        incomingLookup,
        externalNodeMap,
        externalNodeRecord
      )
      if (!externalSource) return
      const targetNodeId = serviceNodeLookup.get(service.identifier)
      if (!targetNodeId) return
      edges.push(buildEdge(externalSource, targetNodeId, connection.connectionType, 'incoming'))
    })
  })

  const signature = createGraphSignature('group-services', {
    group: group.groupName,
    services: services.map(service => ({ identifier: service.identifier, type: service.serviceType })).sort((a, b) =>
      a.identifier.localeCompare(b.identifier)
    ),
    external: externalGroups.map(entry => ({
      direction: entry.direction,
      group: entry.group.groupName,
      services: entry.services.map(service => service.identifier).sort()
    }))
  })

  return {
    graph: { nodes: nodes.concat(Array.from(externalNodeMap.values())), edges, signature },
    serviceNodes: serviceNodeRecord,
    externalNodes: externalNodeRecord
  }
}

function createDirectionLookup(
  entries: ExternalGroupServices[],
  direction: ExternalConnectionDirection
): Map<string, ExternalGroupServices> {
  return entries.reduce((lookup, entry) => {
    if (entry.direction === direction && entry.group?.groupName) {
      lookup.set(entry.group.groupName, entry)
    }
    return lookup
  }, new Map<string, ExternalGroupServices>())
}

function ensureExternalNode(
  direction: ExternalConnectionDirection,
  groupId: string,
  serviceId: string,
  lookup: Map<string, ExternalGroupServices>,
  nodeMap: Map<string, RawFlowNode>,
  record: Record<string, { service: ServiceDefinition; group: GroupInfo }>
): string | null {
  const key = `${direction}_${groupId}_${serviceId}`
  if (nodeMap.has(key)) {
    return key
  }

  const externalMeta = findExternalService(direction, groupId, serviceId, lookup)
  if (!externalMeta) {
    return null
  }

  nodeMap.set(key, {
    id: key,
    width: 220,
    height: 120,
    data: {
      label: externalMeta.service.friendlyName,
      subLabel: externalMeta.group.name,
      iconPath: getAwsIconPath(externalMeta.service.serviceType),
      groupId: externalMeta.group.groupName,
      serviceId: externalMeta.service.identifier,
      kind: 'external',
      direction
    }
  })
  record[key] = { service: externalMeta.service, group: externalMeta.group }

  return key
}

function findExternalService(
  direction: ExternalConnectionDirection,
  groupId: string,
  serviceId: string,
  lookup: Map<string, ExternalGroupServices>
): ExternalNodeMeta | null {
  const entry = lookup.get(groupId)
  if (!entry || entry.direction !== direction) {
    return null
  }
  const service = entry.services.find(item => item.identifier === serviceId)
  if (!service) {
    return null
  }
  return { direction, group: entry.group, service }
}

function buildEdge(
  sourceId: string,
  targetId: string,
  connectionType: ConnectionType,
  direction: 'incoming' | 'outgoing' | 'internal' = 'internal'
): RawFlowEdge {
  const color = edgeColorForConnection(connectionType)
  return {
    id: `edge_${sourceId}_${targetId}_${direction}`,
    source: sourceId,
    target: targetId,
    label: connectionType,
    style: { stroke: color },
    data: { label: connectionType, connectionType, direction }
  }
}
