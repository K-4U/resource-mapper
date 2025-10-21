import {type Edge, MarkerType, type Node} from '@vue-flow/core'
import {GroupNode} from '~/composables/useFlowNodes'
import type {ServiceDefinition} from '~/generated/api/src'

export function useGroupGraph() {

    function buildGraph(
        services: ServiceDefinition[],
        allServices: Record<string, ServiceDefinition[]>,
        groupName: string,
        capitalizedGroupName: string
    ) {
        const tempNodes: Node[] = []
        const tempEdges: Edge[] = []
        const externalGroups = new Map<string, GroupNode>()
        const externalServiceMap = new Map<string, ServiceDefinition>()

        // Track target handle assignment for each service
        const targetHandleCounters = new Map<string, number>()

        const mainGroup = new GroupNode(
            groupName,
            capitalizedGroupName,
            100,
            100,
            false
        )

        mainGroup.registerServices(services)

        // Create nodes and edges
        services.forEach((service, index) => {
            const serviceId = `${service.groupName}/${service.identifier}`

            const serviceNode = mainGroup.addService(service, index, false)

            // Process outgoing connections
            processServiceConnections(
                service,
                serviceNode.id,
                groupName,
                allServices,
                externalGroups,
                externalServiceMap,
                tempEdges,
                targetHandleCounters
            )

            // Process incoming connections
            processIncomingConnections(
                service,
                serviceNode.id,
                groupName,
                allServices,
                externalGroups,
                externalServiceMap,
                tempEdges,
                targetHandleCounters
            )
        })

        tempNodes.push(...mainGroup.getAllNodes())
        externalGroups.forEach((group) => {
            tempNodes.push(...group.getAllNodes())
        })

        return {nodes: tempNodes, edges: tempEdges}
    }

    function processServiceConnections(
        service: ServiceDefinition,
        serviceId: string,
        currentGroupName: string,
        allServices: Record<string, ServiceDefinition[]>,
        externalGroups: Map<string, GroupNode>,
        externalServiceMap: Map<string, ServiceDefinition>,
        edges: Edge[],
        targetHandleCounters: Map<string, number>
    ) {
        if (!service.outgoingConnections) return

        service.outgoingConnections.forEach((connection) => {
            const targetId = connection.targetIdentifier
            const targetGroupName = targetId.split('/')[0] ?? ''

            if (targetGroupName !== currentGroupName) {
                handleExternalConnection(
                    targetGroupName,
                    targetId,
                    allServices,
                    externalGroups,
                    externalServiceMap
                )
            }

            // Assign target handle for incoming connection
            const currentHandleIndex = targetHandleCounters.get(targetId) || 0
            const targetHandle = `input-${currentHandleIndex}`
            targetHandleCounters.set(targetId, currentHandleIndex + 1)

            edges.push({
                id: `${serviceId}-${targetId}`,
                source: serviceId,
                target: targetId,
                targetHandle: targetHandle,
                label: connection.connectionType,
                type: 'smoothstep',
                animated: targetGroupName !== currentGroupName,
                class: targetGroupName !== currentGroupName ? 'external' : 'internal',
                markerEnd: MarkerType.ArrowClosed
            })
        })
    }

    function processIncomingConnections(
        service: ServiceDefinition,
        serviceId: string,
        currentGroupName: string,
        allServices: Record<string, ServiceDefinition[]>,
        externalGroups: Map<string, GroupNode>,
        externalServiceMap: Map<string, ServiceDefinition>,
        edges: Edge[],
        targetHandleCounters: Map<string, number>
    ) {
        if (!service.incomingConnections) return

        service.incomingConnections.forEach((incomingConnection) => {
            const sourceId = incomingConnection.targetIdentifier
            const sourceGroupName = sourceId.split('/')[0] ?? ''

            if (sourceGroupName !== currentGroupName) {
                handleExternalConnection(
                    sourceGroupName,
                    sourceId,
                    allServices,
                    externalGroups,
                    externalServiceMap
                )

                const edgeId = `${sourceId}-${serviceId}`
                if (!edges.some(e => e.id === edgeId)) {
                    const currentHandleIndex = targetHandleCounters.get(serviceId) || 0
                    const targetHandle = `input-${currentHandleIndex}`
                    targetHandleCounters.set(serviceId, currentHandleIndex + 1)

                    edges.push({
                        id: edgeId,
                        source: sourceId,
                        target: serviceId,
                        targetHandle: targetHandle,
                        label: incomingConnection.connectionType,
                        type: 'smoothstep',
                        animated: true,
                        class: 'incoming',
                        markerEnd: MarkerType.ArrowClosed
                    })
                }
            }
        })
    }

    function handleExternalConnection(
        targetGroupName: string,
        targetId: string,
        allServices: Record<string, ServiceDefinition[]>,
        externalGroups: Map<string, GroupNode>,
        externalServiceMap: Map<string, ServiceDefinition>
    ) {
        let targetService: ServiceDefinition | undefined
        if (allServices[targetGroupName]) {
            targetService = allServices[targetGroupName].find(
                s => `${s.groupName}/${s.identifier}` === targetId
            )
        }

        if (!targetService) return

        if (!externalGroups.has(targetGroupName)) {
            const capitalizedExtGroupName =
                targetGroupName.charAt(0).toUpperCase() + targetGroupName.slice(1).toLowerCase()

            const groupIndex = externalGroups.size
            const externalGroup = new GroupNode(
                targetGroupName,
                capitalizedExtGroupName,
                900,
                100 + groupIndex * 250,
                true
            )

            const externalGroupServices = allServices[targetGroupName] || []
            externalGroup.registerServices(externalGroupServices)

            externalGroups.set(targetGroupName, externalGroup)
        }

        if (!externalServiceMap.has(targetId)) {
            const group = externalGroups.get(targetGroupName)!
            const serviceIndex = group.getServices().length
            group.addService(targetService, serviceIndex, true)
            externalServiceMap.set(targetId, targetService)
        }
    }

    return {
        buildGraph
    }
}
