import {
    type ConnectionType,
    type ExternalConnectionDirection,
    type ExternalGroupServices,
    type GroupConnection,
    type GroupInfo,
    type ServiceDefinition,
    type ServiceIncomingLink,
    type ServiceLink
} from '$shared/types'
import type {FlowEdgeData, FlowNodeData, ServicesGraphResult, GraphNode, GraphEdge} from '$shared/flow-types'
import {createGraphSignature} from '$lib/utils/flow/helpers'
import {getServiceNodeIdFromDefinition} from '$lib/utils/flow/serviceIds'

const position = {x: 0, y: 0};

function createServiceNode(nodeId: string, service: ServiceDefinition): GraphNode<FlowNodeData> {
    return {
        id: nodeId,
        type: 'service',
        width: 220,
        height: 120,
        data: {
            label: service.friendlyName,
            subLabel: service.description ?? undefined,
            groupId: service.groupId,
            serviceId: service.identifier,
            serviceType: service.serviceType,
            kind: 'service'
        },
        parentId: `group_${service.groupId}`,
        position
    };
}


export function buildGroupServicesGraph(
    currentGroup: GroupInfo,
    currentServices: ServiceDefinition[],
    allGroups: Map<string, GroupInfo>,
    groupConnections: GroupConnection[],
    externalGroups: ExternalGroupServices[] = []
): ServicesGraphResult {
    const nodes: GraphNode<FlowNodeData>[] = []
    const edges: GraphEdge<FlowEdgeData>[] = []
    const serviceNodeLookup = new Map<string, string>()
    const externalNodeMap = new Map<string, GraphNode<FlowNodeData>>()
    const serviceNodeRecord: Record<string, ServiceDefinition> = {}
    const externalNodeRecord: Record<string, { service: ServiceDefinition; group: GroupInfo }> = {}

    if (!currentServices.length) {
        nodes.push({
            id: `placeholder_${currentGroup.groupName}`,
            data: {
                label: 'No services defined',
                subLabel: 'Add services to see relationships',
                kind: 'service',
                groupId: currentGroup.groupName,
                isPlaceholder: true
            },
            position
        })
        return {
            graph: {
                groupNodes: [],
                serviceNodes: nodes,
                edges,
                signature: createGraphSignature('group-services', {group: currentGroup.groupName, placeholder: true})
            },
            serviceNodes: serviceNodeRecord,
            externalNodes: externalNodeRecord
        }
    }

    // 2. Add Connections
    const externalLookup = createDirectionLookup(externalGroups)

    const addConnections = (
        serviceNodeId: string,
        connections: (ServiceLink | ServiceIncomingLink)[] | undefined
    ) => {
        connections?.forEach(conn => {
            const isOutgoing = 'targetIdentifier' in conn
            const remoteIdentifier = isOutgoing ? conn.targetIdentifier : conn.sourceIdentifier
            if (remoteIdentifier.groupId === currentGroup.groupName) {
                const remoteNodeId = remoteIdentifier.serviceId ? serviceNodeLookup.get(remoteIdentifier.serviceId) : undefined
                if (remoteNodeId) {
                    const sourceId = isOutgoing ? serviceNodeId : remoteNodeId
                    const targetId = isOutgoing ? remoteNodeId : serviceNodeId
                    edges.push(buildEdge(sourceId, targetId, conn.connectionType, 'internal'))
                }
            } else if (remoteIdentifier.groupId && remoteIdentifier.serviceId) {
                const extNodeId = ensureExternalNode(remoteIdentifier.groupId, remoteIdentifier.serviceId, externalLookup, externalNodeMap, externalNodeRecord)
                if (extNodeId) {
                    const sourceId = isOutgoing ? serviceNodeId : extNodeId
                    const targetId = isOutgoing ? extNodeId : serviceNodeId
                    edges.push(buildEdge(sourceId, targetId, conn.connectionType, 'external'))
                }
            }
        })
    }

    currentServices.forEach(service => {
        const nodeId = getServiceNodeIdFromDefinition(service)
        serviceNodeLookup.set(service.identifier, nodeId)
        serviceNodeRecord[nodeId] = service
        nodes.push(createServiceNode(nodeId, service))
    })

    currentServices.forEach(service => {
        const currentServiceNodeId = serviceNodeLookup.get(service.identifier)
        if (!currentServiceNodeId) return

        addConnections(currentServiceNodeId, service.outgoingConnections)
        addConnections(currentServiceNodeId, service.incomingConnections)
    })

    // 4. Create Group Container Nodes
    const groupNodes: GraphNode<FlowNodeData>[] = Array.from(allGroups.values()).map(g => ({
        id: `group_${g.groupName}`,
        type: 'serviceGroup',
        data: {
            label: g.name,
            subLabel: g.description ?? undefined,
            groupId: g.groupName,
            kind: 'group'
        },
        position,
        class: g.groupName === currentGroup.groupName ? 'current-group' : 'external-group'
    }))

    // 5. Add Group-to-Group Edges
    groupConnections.forEach(conn => {
        edges.push(buildEdge(`group_${conn.sourceGroup}`, `group_${conn.targetGroup}`, 'service-group'))
    })

    const signature = createGraphSignature('group-services', {
        group: currentGroup.groupName,
        services: currentServices.map(service => ({identifier: service.identifier, type: service.serviceType})).sort((a, b) =>
            a.identifier.localeCompare(b.identifier)
        ),
        external: externalGroups.map(entry => ({
            direction: entry.direction,
            group: entry.group.groupName,
            services: entry.services.map(service => service.identifier).sort()
        }))
    })

    return {
        graph: {
            groupNodes,
            serviceNodes: nodes.concat(Array.from(externalNodeMap.values())),
            edges,
            signature
        },
        serviceNodes: serviceNodeRecord,
        externalNodes: externalNodeRecord
    }
}

function createDirectionLookup(
    entries: ExternalGroupServices[]
): Map<string, { incoming?: ExternalGroupServices; outgoing?: ExternalGroupServices }> {
    return entries.reduce((lookup, entry) => {
        const key = entry.group?.groupName
        if (!key) return lookup
        const existing = lookup.get(key) || {}
        if (entry.direction === 'incoming') {
            existing.incoming = entry
        } else if (entry.direction === 'outgoing') {
            existing.outgoing = entry
        }
        lookup.set(key, existing)
        return lookup
    }, new Map<string, { incoming?: ExternalGroupServices; outgoing?: ExternalGroupServices }>())
}

// Registers an external node in the nodeMap and externalNodeRecord.
// It uses a consistent svc::<groupId>::<serviceId> naming scheme.
function ensureExternalNode(
    groupId: string,
    serviceId: string,
    lookup: Map<string, { incoming?: ExternalGroupServices; outgoing?: ExternalGroupServices }>,
    nodeMap: Map<string, GraphNode<FlowNodeData>>,
    record: Record<string, { service: ServiceDefinition; group: GroupInfo }>
): string | null {
    const key = `svc::${groupId}::${serviceId}`
    if (nodeMap.has(key)) {
        return key
    }

    // Try to find the service in either direction
    const externalMeta = findExternalService('outgoing', groupId, serviceId, lookup) ||
        findExternalService('incoming', groupId, serviceId, lookup)

    if (!externalMeta) {
        return null
    }

    nodeMap.set(key, {
        id: key,
        width: 220,
        height: 70,
        type: 'external',
        data: {
            label: externalMeta.service.friendlyName,
            serviceType: externalMeta.service.serviceType,
            subLabel: externalMeta.group.name,
            groupId: groupId,
            serviceId: externalMeta.service.identifier,
            kind: 'external',
        },
        extent: "parent",
        position: {x: 0, y: 0},
        parentId: `group_${groupId}`,
    })
    record[key] = {service: externalMeta.service, group: externalMeta.group}

    return key
}

function findExternalService(
    direction: ExternalConnectionDirection,
    groupId: string,
    serviceId: string,
    lookup: Map<string, { incoming?: ExternalGroupServices; outgoing?: ExternalGroupServices }>
) {
    const entries = lookup.get(groupId)
    if (!entries) return null
    const dirEntry = entries[direction]
    if (!dirEntry) return null
    const service = dirEntry.services.find(item => item.identifier === serviceId)
    if (!service) return null
    return { group: dirEntry.group, service }
}

function buildEdge(
    sourceId: string,
    targetId: string,
    connectionType?: ConnectionType | 'service-group',
    edgeType: 'external' | 'internal' = 'internal' //TODO: Name me better
): GraphEdge<FlowEdgeData> {
    console.debug(`Creating edge from ${sourceId} to ${targetId} of type ${connectionType} (${edgeType})`)
    return {
        id: `edge_${sourceId}_${targetId}`,
        source: sourceId,
        sourceHandle: 'output',
        target: targetId,
        targetHandle: 'input',
        type: 'snake',
        // type: 'smoothstep',
        markerEnd: 'arrow',
        class: `edge-${edgeType}`,
        label: connectionType || "",
        data: {label: connectionType, connectionType}
    }
}
