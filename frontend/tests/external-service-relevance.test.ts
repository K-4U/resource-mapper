import { describe, it, expect } from 'vitest'
import type { ServiceDefinition } from '../types'
import { ServiceType, ConnectionType } from '../types'

// Test the specific logic for determining which external services should be shown
function getRelevantExternalServices(
  currentGroupServices: ServiceDefinition[],
  allServices: Record<string, ServiceDefinition[]>,
  currentGroupName: string
): Set<string> {
  const relevantServices = new Set<string>()
  
  // Collect services that the current group connects TO (outgoing)
  currentGroupServices.forEach(service => {
    if (service.outgoingConnections) {
      service.outgoingConnections.forEach(connection => {
        const targetGroupName = connection.targetIdentifier.split('/')[0]
        if (targetGroupName !== currentGroupName) {
          relevantServices.add(connection.targetIdentifier)
        }
      })
    }
  })
  
  // Collect services that connect TO the current group (incoming)
  currentGroupServices.forEach(service => {
    if (service.incomingConnections) {
      service.incomingConnections.forEach(connection => {
        const sourceGroupName = connection.targetIdentifier.split('/')[0]
        if (sourceGroupName !== currentGroupName) {
          relevantServices.add(connection.targetIdentifier)
        }
      })
    }
  })
  
  return relevantServices
}

describe('External Service Relevance', () => {
  it('should not show external services with no connection to current group', () => {
    // Test scenario: viewing "compute" group
    // - API Gateway (api/api-gateway) should NOT be visible because it has no connection to compute services
    // - Only external services that connect TO or FROM compute services should be shown

    const computeServices: ServiceDefinition[] = [
      {
        identifier: 'ecs-inventory',
        friendlyName: 'ECS Inventory Service',
        groupName: 'compute',
        serviceType: ServiceType.ECS,
        outgoingConnections: [
          {
            targetIdentifier: 'data/dynamodb-products',
            connectionType: ConnectionType.CALLS,
            description: 'Database Query'
          }
        ],
        incomingConnections: [
          {
            targetIdentifier: 'api/lambda-products',
            connectionType: ConnectionType.CALLS,
            description: 'HTTP API'
          }
        ]
      },
      {
        identifier: 'ecs-notification',
        friendlyName: 'ECS Notification Service', 
        groupName: 'compute',
        serviceType: ServiceType.ECS,
        outgoingConnections: [
          {
            targetIdentifier: 'data/dynamodb-notifications',
            connectionType: ConnectionType.CALLS,
            description: 'Database Query'
          }
        ],
        incomingConnections: []
      }
    ]

    const allServices: Record<string, ServiceDefinition[]> = {
      compute: computeServices,
      api: [
        {
          identifier: 'api-gateway',
          friendlyName: 'API Gateway',
          groupName: 'api',
          serviceType: ServiceType.API_GATEWAY,
          outgoingConnections: [
            {
              targetIdentifier: 'api/lambda-users',
              connectionType: ConnectionType.CALLS,
              description: 'HTTP Request'
            }
          ],
          incomingConnections: []
        },
        {
          identifier: 'lambda-products',
          friendlyName: 'Lambda Products',
          groupName: 'api',
          serviceType: ServiceType.LAMBDA,
          outgoingConnections: [
            {
              targetIdentifier: 'compute/ecs-inventory',
              connectionType: ConnectionType.CALLS,
              description: 'HTTP API'
            }
          ],
          incomingConnections: []
        },
        {
          identifier: 'lambda-users',
          friendlyName: 'Lambda Users',
          groupName: 'api',
          serviceType: ServiceType.LAMBDA,
          outgoingConnections: [],
          incomingConnections: [
            {
              targetIdentifier: 'api/api-gateway',
              connectionType: ConnectionType.CALLS,
              description: 'HTTP Request'
            }
          ]
        }
      ],
      data: [
        {
          identifier: 'dynamodb-products',
          friendlyName: 'DynamoDB Products',
          groupName: 'data',
          serviceType: ServiceType.DYNAMODB,
          outgoingConnections: [],
          incomingConnections: [
            {
              targetIdentifier: 'compute/ecs-inventory',
              connectionType: ConnectionType.CALLS,
              description: 'Database Query'
            }
          ]
        },
        {
          identifier: 'dynamodb-notifications',
          friendlyName: 'DynamoDB Notifications',
          groupName: 'data',
          serviceType: ServiceType.DYNAMODB,
          outgoingConnections: [],
          incomingConnections: [
            {
              targetIdentifier: 'compute/ecs-notification',
              connectionType: ConnectionType.CALLS,
              description: 'Database Query'
            }
          ]
        }
      ]
    }

    const relevantExternalServices = getRelevantExternalServices(computeServices, allServices, 'compute')
    
    // Convert to array for easier testing
    const relevantServiceIds = Array.from(relevantExternalServices)
    
    // Should include external services that connect TO compute services
    expect(relevantServiceIds).toContain('api/lambda-products') // connects TO compute/ecs-inventory
    
    // Should include external services that compute services connect TO
    expect(relevantServiceIds).toContain('data/dynamodb-products') // ecs-inventory connects TO this
    expect(relevantServiceIds).toContain('data/dynamodb-notifications') // ecs-notification connects TO this
    
    // Should NOT include external services with no connection to compute group
    expect(relevantServiceIds).not.toContain('api/api-gateway') // no connection to compute services
    expect(relevantServiceIds).not.toContain('api/lambda-users') // no connection to compute services
    
    // Verify total count - should only have the 3 relevant external services
    expect(relevantExternalServices.size).toBe(3)
  })

  it('should handle groups with no external connections', () => {
    // Test a group that has no connections to other groups
    const isolatedServices: ServiceDefinition[] = [
      {
        identifier: 'isolated-service',
        friendlyName: 'Isolated Service',
        groupName: 'isolated',
        serviceType: ServiceType.ECS,
        outgoingConnections: [],
        incomingConnections: []
      }
    ]

    const allServices: Record<string, ServiceDefinition[]> = {
      isolated: isolatedServices,
      api: [
        {
          identifier: 'api-gateway',
          friendlyName: 'API Gateway',
          groupName: 'api',
          serviceType: ServiceType.API_GATEWAY,
          outgoingConnections: [],
          incomingConnections: []
        }
      ]
    }

    const relevantExternalServices = getRelevantExternalServices(isolatedServices, allServices, 'isolated')
    
    // Should have no external services since there are no connections
    expect(relevantExternalServices.size).toBe(0)
    expect(Array.from(relevantExternalServices)).toEqual([])
  })
})