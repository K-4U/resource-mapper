import { describe, it, expect } from 'vitest'
import { buildGroupServicesGraph } from './servicesGraph'
import { ConnectionType, ServiceType, type GroupInfo, type ServiceDefinition } from '$shared/types'

describe('servicesGraph', () => {
  const currentGroup: GroupInfo = {
    id: 'g1',
    name: 'Group 1',
    groupName: 'g1'
  }

  const allGroups = new Map<string, GroupInfo>([
    ['g1', currentGroup]
  ])

  it('correctly loads bidirectional connections between two services in the same group', () => {
    const serviceA: ServiceDefinition = {
      friendlyName: 'Service A',
      identifier: 'svc-a',
      serviceType: ServiceType.LAMBDA,
      groupId: 'g1',
      outgoingConnections: [
        {
          connectionType: ConnectionType.TCP,
          targetIdentifier: { groupId: 'g1', serviceId: 'svc-b' },
          description: 'A to B'
        }
      ]
    }

    const serviceB: ServiceDefinition = {
      friendlyName: 'Service B',
      identifier: 'svc-b',
      serviceType: ServiceType.DYNAMODB,
      groupId: 'g1',
      outgoingConnections: [
        {
          connectionType: ConnectionType.TCP,
          targetIdentifier: { groupId: 'g1', serviceId: 'svc-a' },
          description: 'B to A'
        }
      ]
    }

    const currentServices = [serviceA, serviceB]
    const result = buildGroupServicesGraph(currentGroup, currentServices, allGroups, [])

    // We expect two nodes and two edges
    expect(result.graph.serviceNodes.length).toBe(2)
    
    // Check edges
    expect(result.graph.edges.length).toBe(2)
    
    const edgeAB = result.graph.edges.find(e => e.source === 'svc::g1::svc-a' && e.target === 'svc::g1::svc-b')
    const edgeBA = result.graph.edges.find(e => e.source === 'svc::g1::svc-b' && e.target === 'svc::g1::svc-a')
    
    expect(edgeAB).toBeDefined()
    expect(edgeBA).toBeDefined()
    
    // Verify IDs are unique
    expect(edgeAB?.id).not.toBe(edgeBA?.id)
  })

  it('correctly loads bidirectional connections involving an external service', () => {
    const serviceA: ServiceDefinition = {
      friendlyName: 'Service A',
      identifier: 'svc-a',
      serviceType: ServiceType.LAMBDA,
      groupId: 'g1',
      outgoingConnections: [
        {
          connectionType: ConnectionType.TCP,
          targetIdentifier: { groupId: 'g2', serviceId: 'svc-ext' },
          description: 'A to External'
        }
      ],
      incomingConnections: [
        {
          connectionType: ConnectionType.TCP,
          sourceIdentifier: { groupId: 'g2', serviceId: 'svc-ext' },
          description: 'External to A'
        }
      ]
    }

    const group2: GroupInfo = { id: 'g2', name: 'Group 2', groupName: 'g2' }
    const serviceExt: ServiceDefinition = {
      friendlyName: 'External Service',
      identifier: 'svc-ext',
      serviceType: ServiceType.RDS,
      groupId: 'g2'
    }

    const externalGroups = [
      {
        group: group2,
        services: [serviceExt],
        direction: 'outgoing' as const
      },
      {
        group: group2,
        services: [serviceExt],
        direction: 'incoming' as const
      }
    ]

    const result = buildGroupServicesGraph(currentGroup, [serviceA], allGroups, [], externalGroups)

    // Should have serviceA and ONE external node (shared between directions)
    expect(result.graph.serviceNodes.length).toBe(2) 
    expect(result.graph.edges.length).toBe(2)

    const edgeToExt = result.graph.edges.find(e => e.source === 'svc::g1::svc-a' && e.target === 'svc::g2::svc-ext')
    const edgeFromExt = result.graph.edges.find(e => e.target === 'svc::g1::svc-a' && e.source === 'svc::g2::svc-ext')

    expect(edgeToExt).toBeDefined()
    expect(edgeFromExt).toBeDefined()
  })
})
