import {
    type ConnectionType,
    type ExternalConnectionDirection,
    type ExternalGroupServices,
    type GroupConnection,
    type GroupInfo,
    type ServiceDefinition,
    type ServiceIdentifier
} from '$lib/types'
import type {FlowEdgeData, FlowNodeData, GroupServicesGraphResult,} from '$lib/utils/flow/types'
import {createGraphSignature} from '$lib/utils/flow/helpers'
import {getServiceNodeIdFromDefinition} from '$lib/utils/flow/serviceIds'
import {getAwsIconPath} from '$lib/utils/awsIcons'
import type {Edge, Node} from "@xyflow/svelte";

interface ExternalNodeMeta {
    direction: ExternalConnectionDirection
    group: GroupInfo
    service: ServiceDefinition
}

const position = {x: 0, y: 0};

function createServiceNode(nodeId: string, service: ServiceDefinition, group: GroupInfo): Node<FlowNodeData> {
    return {
        id: nodeId,
        type: 'service',
        width: 220,
        height: 120,
        data: {
            label: service.friendlyName,
            subLabel: service.description ?? undefined,
            groupId: group.id,
            serviceId: service.identifier,
            serviceType: service.serviceType,
            kind: 'service'
        },
        parentId: `group_${group.id}`,
        position
    };
}

function addGroupIfNotExists(servicesToGroupMap: Map<string, string[]>, target: ServiceIdentifier) {
    if (!servicesToGroupMap.has(target.groupId)) {
        servicesToGroupMap.set(target.groupId, []);
    }
    servicesToGroupMap.get(target.groupId)?.push(target.serviceId);
}

export function buildGroupServicesGraph(
    group: GroupInfo,
    services: ServiceDefinition[],
    allGroups: Map<string, GroupInfo>,
    groupConnections: GroupConnection[],
    externalGroups: ExternalGroupServices[] = []
): GroupServicesGraphResult {
    const nodes: Node<FlowNodeData>[] = []
    const edges: Edge<FlowEdgeData>[] = []
    const serviceNodeLookup = new Map<string, string>()
    const externalNodeMap = new Map<string, Node<FlowNodeData>>()
    const serviceNodeRecord: Record<string, ServiceDefinition> = {}
    const externalNodeRecord: Record<string, { service: ServiceDefinition; group: GroupInfo }> = {}

    const servicesToGroupMap = new Map<string, string[]>();

    if (!services.length) {
        nodes.push({
            id: `placeholder_${group.groupName}`,
            data: {
                label: 'No services defined',
                subLabel: 'Add services to see relationships',
                kind: 'service',
                groupId: group.groupName,
                isPlaceholder: true
            },
            position
        })
        return {
            graph: {
                groupNodes: [],
                serviceNodes: nodes,
                edges,
                signature: createGraphSignature('group-services', {group: group.groupName, placeholder: true})
            },
            serviceNodes: serviceNodeRecord,
            externalNodes: externalNodeRecord
        }
    }

    console.log(allGroups);

    // First pass to create nodes for all services within the group and build a lookup for their IDs
    services.forEach(service => {
        const nodeId = getServiceNodeIdFromDefinition(service)
        serviceNodeLookup.set(service.identifier, nodeId)
        serviceNodeRecord[nodeId] = service

        console.log(service.groupName);
        nodes.push(createServiceNode(nodeId, service, allGroups.get(service.groupName)))

        if (!servicesToGroupMap.has(service.groupName)) {
            servicesToGroupMap.set(service.groupName, []);
        }
        servicesToGroupMap.get(service.groupName)?.push(service.identifier);
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
                allGroups.get(target.groupId),
                target.serviceId,
                outgoingLookup,
                externalNodeMap,
                externalNodeRecord
            )
            if (!externalTarget) return
            edges.push(buildEdge(sourceId, externalTarget, connection.connectionType, 'outgoing'))

            addGroupIfNotExists(servicesToGroupMap, target);
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
                allGroups.get(source.groupId),
                source.serviceId,
                incomingLookup,
                externalNodeMap,
                externalNodeRecord
            )
            if (!externalSource) return
            const targetNodeId = serviceNodeLookup.get(service.identifier)
            if (!targetNodeId) return
            edges.push(buildEdge(externalSource, targetNodeId, connection.connectionType, 'incoming'))

            addGroupIfNotExists(servicesToGroupMap, source);
        })
    })

    const groupNodes: Node<FlowNodeData>[] = []
    //Loop over all visible groups and add them too
    allGroups.forEach((groupInfo, groupName) => {
        groupNodes.push({
            id: `group_${groupName}`,
            type: 'serviceGroup',
            data: {
                label: groupInfo.name,
                subLabel: groupInfo.description ?? undefined,
                groupId: groupInfo.groupName,
                kind: ''
            },
            position
        })
    });

    //Loop over all group connections and add edges between groups.
    groupConnections.forEach(connection => {
        const sourceId = `group_${connection.sourceGroup}`
        const targetId = `group_${connection.targetGroup}`
        edges.push(buildEdge(sourceId, targetId, 'group'))
    });

    const signature = createGraphSignature('group-services', {
        group: group.groupName,
        services: services.map(service => ({identifier: service.identifier, type: service.serviceType})).sort((a, b) =>
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
            groupNodes: groupNodes,
            serviceNodes: nodes.concat(Array.from(externalNodeMap.values())),
            edges,
            signature
        },
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

//TODO: Figure out wtf this method does.
function ensureExternalNode(
    direction: ExternalConnectionDirection,
    group: GroupInfo,
    serviceId: string,
    lookup: Map<string, ExternalGroupServices>,
    nodeMap: Map<string, Node<FlowNodeData>>,
    record: Record<string, { service: ServiceDefinition; group: GroupInfo }>
): string | null {
    const key = `${direction}_${group.id}_${serviceId}`
    if (nodeMap.has(key)) {
        return key
    }

    const externalMeta = findExternalService(direction, group.id, serviceId, lookup)
    if (!externalMeta) {
        return null
    }

    nodeMap.set(key, {
        id: key,
        width: 220,
        height: 120,
        type: 'external',
        data: {
            label: externalMeta.service.friendlyName,
            subLabel: externalMeta.group.name,
            iconPath: getAwsIconPath(externalMeta.service.serviceType),
            groupId: externalMeta.group.groupName,
            serviceId: externalMeta.service.identifier,
            kind: 'external',
            direction
        },
        extent: "parent",
        position: {x: 0, y: 0},
        parentId: `group_${group.groupName}`,
    })
    record[key] = {service: externalMeta.service, group: externalMeta.group}

    return key
}

function findExternalService(
    direction: ExternalConnectionDirection,
    groupId: string,
    serviceId: string,
    lookup: Map<string, ExternalGroupServices>
): ExternalNodeMeta | null {
    const entry = lookup.get(groupId)
    if (entry?.direction !== direction) {
        return null
    }
    const service = entry.services.find(item => item.identifier === serviceId)
    if (!service) {
        return null
    }
    return {direction, group: entry.group, service}
}

function buildEdge(
    sourceId: string,
    targetId: string,
    connectionType?: ConnectionType | 'group',
    direction: 'incoming' | 'outgoing' | 'internal' = 'internal'
): Edge<FlowEdgeData> {
    return {
        id: `edge_${sourceId}_${targetId}_${direction}`,
        source: sourceId,
        sourceHandle: 'output',
        target: targetId,
        targetHandle: 'input',
        type: 'snake',
        // type: 'smoothstep',
        markerEnd: 'arrow',
        class: `edge-${direction.toLowerCase()}`,
        label: connectionType || "",
        data: {label: connectionType, connectionType, direction}
    }
}
