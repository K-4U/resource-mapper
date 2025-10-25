import {type Edge, MarkerType, type Node} from '@vue-flow/core'
import {GroupNode} from '~/composables/useFlowNodes'
import type {ServiceDefinition, GroupConnection} from '~/types'

export function useGroupGraph() {

    function buildGraph(
        services: ServiceDefinition[],
        allServices: Record<string, ServiceDefinition[]>,
        groupName: string,
        capitalizedGroupName: string,
        hideIncomingConnections: boolean = false,
        hideExternalToExternal: boolean = false
    ) {
        const tempNodes: Node[] = []
        const tempEdges: Edge[] = []
        const externalGroups = new Map<string, GroupNode>()
        const externalServiceMap = new Map<string, ServiceDefinition>()

        // Track target handle assignment for each service
        const targetHandleCounters = new Map<string, number>()
        
        // Track service relationship types
        const outgoingTargets = new Set<string>() // Services we connect TO
        const incomingSources = new Set<string>() // Services that connect TO us

        // Position main group in the center
        const mainGroup = new GroupNode(
            groupName,
            capitalizedGroupName,
            500, // Center position
            200,
            false
        )

        mainGroup.registerServices(services)

        // First pass: collect all outgoing targets
        services.forEach((service) => {
            if (service.outgoingConnections) {
                service.outgoingConnections.forEach((connection) => {
                    const targetId = connection.targetIdentifier
                    const targetGroupName = targetId.split('/')[0] ?? ''
                    if (targetGroupName !== groupName) {
                        outgoingTargets.add(targetId)
                    }
                })
            }
        })

        // Second pass: collect all incoming sources
        services.forEach((service) => {
            if (service.incomingConnections) {
                service.incomingConnections.forEach((incomingConnection) => {
                    const sourceId = incomingConnection.targetIdentifier
                    const sourceGroupName = sourceId.split('/')[0]
                    if (sourceGroupName !== groupName) {
                        incomingSources.add(sourceId)
                    }
                })
            }
        })

        // Filter services based on visibility toggles before positioning
        const visibleServices = services.filter(service => {
            const serviceId = `${service.groupName}/${service.identifier}`
            
            // If hiding incoming connections, exclude incoming-only services
            if (hideIncomingConnections) {
                const hasOutgoing = (service.outgoingConnections?.length || 0) > 0
                const hasIncoming = incomingSources.has(serviceId)
                
                // Hide services that only have incoming connections (no outgoing)
                if (hasIncoming && !hasOutgoing) {
                    return false
                }
            }
            
            return true
        })

        // Re-register only visible services for positioning
        mainGroup.registerServices(visibleServices)

        // Create nodes and edges for visible services only
        visibleServices.forEach((service, index) => {
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
                targetHandleCounters,
                outgoingTargets,
                incomingSources,
                hideIncomingConnections,
                hideExternalToExternal
            )

            // Process incoming connections (but only from visible external groups)
            processIncomingConnections(
                service,
                serviceNode.id,
                groupName,
                allServices,
                externalGroups,
                externalServiceMap,
                tempEdges,
                targetHandleCounters,
                outgoingTargets,
                incomingSources
            )
        })

        // ALSO process incoming connections for services in external groups
        // This is needed to show connections like compute -> redis (in data group)
        externalGroups.forEach((externalGroup, externalGroupName) => {
            // Use the cleaned external services from the group, not the global allServices
            const externalServiceNodes = externalGroup.getServices()
            externalServiceNodes.forEach(serviceNode => {
                const externalService = serviceNode.data.service
                const serviceId = `${externalService.groupName}/${externalService.identifier}`
                
                // Only process if this service is actually added to the external group
                if (externalServiceMap.has(serviceId)) {
                    processIncomingConnections(
                        externalService,
                        serviceId,
                        groupName,
                        allServices,
                        externalGroups,
                        externalServiceMap,
                        tempEdges,
                        targetHandleCounters,
                        outgoingTargets,
                        incomingSources,
                        hideIncomingConnections,
                        hideExternalToExternal
                    )
                }
            })
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
        targetHandleCounters: Map<string, number>,
        outgoingTargets: Set<string>,
        incomingSources: Set<string>,
        hideIncomingConnections: boolean = false,
        hideExternalToExternal: boolean = false
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
                    externalServiceMap,
                    outgoingTargets,
                    incomingSources,
                    hideIncomingConnections,
                    hideExternalToExternal
                )
            }

            // Assign target handle for incoming connection
            const currentHandleIndex = targetHandleCounters.get(targetId) || 0
            const targetHandle = `input-${currentHandleIndex}`
            targetHandleCounters.set(targetId, currentHandleIndex + 1)

            // Determine edge classes based on source and target groups
            const sourceGroupName = serviceId.split('/')[0]
            const isSourceExternal = sourceGroupName !== currentGroupName
            const isTargetExternal = targetGroupName !== currentGroupName
            const isBothExternal = isSourceExternal && isTargetExternal
            
            const edgeClasses = []
            
            if (isBothExternal) {
                // Connection between two external groups
                edgeClasses.push('external-to-external')
            } else if (isSourceExternal && !isTargetExternal) {
                // Connection from external group to current group (incoming)
                edgeClasses.push('incoming-connection')
            } else if (!isSourceExternal && isTargetExternal) {
                // Connection from current group to external group (outgoing)
                edgeClasses.push('outgoing-connection')
            } else {
                // Connection within current group (internal)
                edgeClasses.push('internal-connection')
            }
            

            
            // Legacy classes removed to prevent CSS conflicts
            
            // Add incoming-only-connection class if target is an incoming-only service
            if (isTargetExternal && incomingSources.has(targetId) && !outgoingTargets.has(targetId)) {
                edgeClasses.push('incoming-only-connection')
            }

            edges.push({
                id: `${serviceId}-${targetId}`,
                source: serviceId,
                target: targetId,
                targetHandle: targetHandle,
                label: connection.connectionType,
                type: 'smoothstep',
                animated: isTargetExternal || isSourceExternal,
                class: edgeClasses.join(' '),
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
        targetHandleCounters: Map<string, number>,
        outgoingTargets: Set<string>,
        incomingSources: Set<string>,
        hideIncomingConnections: boolean = false,
        hideExternalToExternal: boolean = false
    ) {
        // Use the pre-calculated incoming connections from the service
        if (!service.incomingConnections || service.incomingConnections.length === 0) {
            return // No incoming connections to process
        }
        
        console.log(`Processing ${service.incomingConnections.length} incoming connections for ${serviceId}`)
        
        service.incomingConnections.forEach(incomingConnection => {
            const sourceId = incomingConnection.targetIdentifier
            const sourceGroupName = sourceId.split('/')[0]
            
            // Skip if we can't determine the source group or it's the same group
            if (!sourceGroupName || sourceGroupName === currentGroupName) {
                return
            }
            
            // Ensure the source service is visible (add to external groups if not already there)
            handleExternalConnection(
                sourceGroupName,
                sourceId,
                allServices,
                externalGroups,
                externalServiceMap,
                outgoingTargets,
                incomingSources,
                hideIncomingConnections,
                hideExternalToExternal
            )
            
            // Now the source service should be in externalServiceMap
            if (externalServiceMap.has(sourceId)) {
                const edgeId = `${sourceId}-${serviceId}`
                
                // Only add if edge doesn't already exist
                if (!edges.some(e => e.id === edgeId)) {
                    const currentHandleIndex = targetHandleCounters.get(serviceId) || 0
                    const targetHandle = `input-${currentHandleIndex}`
                    targetHandleCounters.set(serviceId, currentHandleIndex + 1)

                    // Determine connection type for proper styling
                    const targetGroupName = serviceId.split('/')[0]
                    const isSourceExternal = sourceGroupName !== currentGroupName
                    const isTargetExternal = targetGroupName !== currentGroupName
                    const isBothExternal = isSourceExternal && isTargetExternal
                    
                    const edgeClasses = []
                    
                    if (isBothExternal) {
                        // Connection between two external groups
                        edgeClasses.push('external-to-external')
                    } else if (isSourceExternal && !isTargetExternal) {
                        // Connection from external group to current group (incoming)
                        edgeClasses.push('incoming-connection')
                    } else if (!isSourceExternal && isTargetExternal) {
                        // Connection from current group to external group (outgoing)
                        edgeClasses.push('outgoing-connection')
                    } else {
                        // Connection within current group (internal)
                        edgeClasses.push('internal-connection')
                    }
                    
                    // Add legacy classes for backward compatibility
                    edgeClasses.push('external')
                    
                    // Mark connections involving incoming-only services
                    if (incomingSources.has(sourceId) && !outgoingTargets.has(sourceId)) {
                        edgeClasses.push('incoming-only-connection')
                    }

                    edges.push({
                        id: edgeId,
                        source: sourceId,
                        target: serviceId,
                        targetHandle: targetHandle,
                        label: incomingConnection.connectionType,
                        type: 'smoothstep',
                        animated: true, // External connections are animated
                        class: edgeClasses.join(' '),
                        markerEnd: MarkerType.ArrowClosed
                    })
                    
                    console.log(`Added incoming edge: ${sourceId} -> ${serviceId}`)
                }
            }
        })
    }

    function handleExternalConnection(
        targetGroupName: string,
        targetId: string,
        allServices: Record<string, ServiceDefinition[]>,
        externalGroups: Map<string, GroupNode>,
        externalServiceMap: Map<string, ServiceDefinition>,
        outgoingTargets: Set<string>,
        incomingSources: Set<string>,
        hideIncomingConnections: boolean = false,
        hideExternalToExternal: boolean = false
    ) {
        // Only process services that are directly relevant to the current group
        if (!outgoingTargets.has(targetId) && !incomingSources.has(targetId)) {
            return // This service has no direct connection to the current group
        }
        
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

            // Determine if this group contains incoming sources or outgoing targets
            const groupServices = allServices[targetGroupName] || []
            const hasIncomingSources = groupServices.some(service => 
                incomingSources.has(`${service.groupName}/${service.identifier}`)
            )
            const hasOutgoingTargets = groupServices.some(service => 
                outgoingTargets.has(`${service.groupName}/${service.identifier}`)
            )

            // Position based on relationship type
            let xPosition: number
            if (hasIncomingSources && !hasOutgoingTargets) {
                // Pure incoming sources go to the left
                xPosition = 50
            } else if (hasOutgoingTargets && !hasIncomingSources) {
                // Pure outgoing targets go to the right  
                xPosition = 950
            } else {
                // Mixed relationship - place based on which is more dominant
                const incomingCount = groupServices.filter(service => 
                    incomingSources.has(`${service.groupName}/${service.identifier}`)
                ).length
                const outgoingCount = groupServices.filter(service => 
                    outgoingTargets.has(`${service.groupName}/${service.identifier}`)  
                ).length
                
                if (incomingCount > outgoingCount) {
                    xPosition = 50  // More incoming - place left
                } else {
                    xPosition = 950 // More outgoing or equal - place right
                }
            }

            // Stack groups vertically based on existing groups in the same position
            const existingGroupsAtPosition = Array.from(externalGroups.values())
                .filter(group => Math.abs(group.position.x - xPosition) < 50)
            const yOffset = existingGroupsAtPosition.length * 250

            const externalGroup = new GroupNode(
                targetGroupName,
                capitalizedExtGroupName,
                xPosition,
                200 + yOffset, // Align with main group vertically
                true,
                {
                    connectionDirection: 'horizontal',
                    sourceSide: xPosition < 500 ? 'right' : 'left', // Left groups connect from right, right groups from left
                    targetSide: xPosition < 500 ? 'left' : 'right'  // Opposite for target side
                }
            )

            const externalGroupServices = allServices[targetGroupName] || []
            // Clean external services of global incoming connections to avoid extra target handles
            const cleanedExternalServices = externalGroupServices.map(service => ({
                ...service,
                incomingConnections: []
            }))
            externalGroup.registerServices(cleanedExternalServices)

            externalGroups.set(targetGroupName, externalGroup)
        }

        if (!externalServiceMap.has(targetId)) {
            const group = externalGroups.get(targetGroupName)!
            
            // Determine if this is an incoming-only service (not a target of our outgoing connections)
            const isIncomingOnly = incomingSources.has(targetId) && !outgoingTargets.has(targetId)
            
            // Skip adding this service if it should be hidden
            if (hideIncomingConnections && isIncomingOnly) {
                return // Don't add incoming-only services when hiding incoming connections
            }
            
            const serviceIndex = group.getServices().length
            group.addService(targetService, serviceIndex, true, isIncomingOnly)
            externalServiceMap.set(targetId, targetService)
        }
    }

    function buildGraphFromConnections(groupConnections: GroupConnection[]) {
        const nodes: Node[] = []
        const edges: Edge[] = []
        
        // Create nodes for each group
        groupConnections.forEach((group, index) => {
            const x = (index % 3) * 300 + 100  // 3 columns layout
            const y = Math.floor(index / 3) * 200 + 100
            
            nodes.push({
                id: group.groupName,
                type: 'default',
                position: { x, y },
                data: {
                    label: group.groupName,
                    description: group.description,
                    serviceCount: group.serviceCount
                },
                style: {
                    background: '#ffffff',
                    border: '2px solid #1976d2',
                    borderRadius: '8px',
                    padding: '10px',
                    minWidth: '150px',
                    textAlign: 'center'
                }
            })
        })
        
        // Create edges for connections between groups
        groupConnections.forEach(group => {
            if (group.connectedToGroups) {
                Array.from(group.connectedToGroups).forEach(targetGroup => {
                    // Only create edge if target group exists in our nodes
                    if (groupConnections.some(g => g.groupName === targetGroup)) {
                        edges.push({
                            id: `${group.groupName}-${targetGroup}`,
                            source: group.groupName,
                            target: targetGroup,
                            type: 'smoothstep',
                            animated: true,
                            markerEnd: MarkerType.ArrowClosed,
                            style: {
                                stroke: '#1976d2',
                                strokeWidth: 2
                            }
                        })
                    }
                })
            }
        })
        
        return { nodes, edges }
    }

    return {
        buildGraph,
        buildGraphFromConnections
    }
}
