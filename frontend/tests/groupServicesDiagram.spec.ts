import { describe, it, expect } from 'vitest'
import { buildGroupServicesDiagram } from '~/utils/mermaid/groupServicesDiagram'
import { ConnectionType, ServiceType, type ExternalGroupServices, type GroupInfo, type ServiceDefinition } from '~/types'

const baseGroup: GroupInfo = {
  name: 'API',
  groupName: 'api',
  description: 'Core API',
  teamId: 'api'
}

function makeService(identifier: string, overrides: Partial<ServiceDefinition> = {}): ServiceDefinition {
  return {
    friendlyName: identifier,
    description: `${identifier} service`,
    serviceType: ServiceType.LAMBDA,
    identifier,
    groupName: overrides.groupName ?? baseGroup.groupName,
    outgoingConnections: [],
    incomingConnections: [],
    ...overrides
  }
}

describe('buildGroupServicesDiagram', () => {
  it('renders outgoing external connections as their own subgraph', () => {
    const gateway = makeService('gateway', {
      outgoingConnections: [
        {
          connectionType: ConnectionType.CALLS,
          targetIdentifier: { groupId: 'data', serviceId: 'warehouse' },
          description: 'Call data warehouse'
        }
      ]
    })

    const externalGroups: ExternalGroupServices[] = [
      {
        direction: 'outgoing',
        group: { name: 'Data Platform', groupName: 'data' },
        services: [
          makeService('warehouse', {
            groupName: 'data',
            identifier: 'warehouse',
            friendlyName: 'Warehouse',
            outgoingConnections: [],
            incomingConnections: []
          })
        ]
      }
    ]

    const diagram = buildGroupServicesDiagram(baseGroup, [gateway], externalGroups)

    expect(diagram).toContain('subgraph outgoing_data')
    expect(diagram).toContain('api_gateway -->|CALLS| data_warehouse')
  })

  it('renders incoming external connections as their own subgraph', () => {
    const orders = makeService('orders', {
      incomingConnections: [
        {
          connectionType: ConnectionType.EVENTBRIDGE,
          sourceIdentifier: { groupId: 'integration', serviceId: 'bus' },
          description: 'Events from integration bus'
        }
      ]
    })

    const externalGroups: ExternalGroupServices[] = [
      {
        direction: 'incoming',
        group: { name: 'Integration', groupName: 'integration' },
        services: [
          makeService('bus', {
            groupName: 'integration',
            identifier: 'bus',
            friendlyName: 'Event Bus'
          })
        ]
      }
    ]

    const diagram = buildGroupServicesDiagram(baseGroup, [orders], externalGroups)

    expect(diagram).toContain('subgraph incoming_integration')
    expect(diagram).toContain('integration_bus --> api_orders')
  })
})
