import { describe, it, expect } from 'vitest'
import { NodePositionCalculator } from '../composables/useNodePositioning'
import type { ServiceDefinition } from '../types'
import { ConnectionType, ServiceType } from '../types'

describe('Service Positioning Debug', () => {
  it('should position ALB in first column (layer 0)', () => {
    const services: ServiceDefinition[] = [
      {
        groupName: 'compute',
        identifier: 'alb',
        friendlyName: 'Application Load Balancer',
        serviceType: ServiceType.ALB,
        outgoingConnections: [
          { targetIdentifier: 'compute/ecs-inventory', connectionType: ConnectionType.CALLS, description: 'Routes to inventory' }
        ],
        incomingConnections: []
      },
      {
        groupName: 'compute',
        identifier: 'ecs-inventory',
        friendlyName: 'ECS Inventory Service',
        serviceType: ServiceType.ECS,
        outgoingConnections: [],
        incomingConnections: [
          { targetIdentifier: 'compute/alb', connectionType: ConnectionType.CALLS, description: 'Receives from ALB' }
        ]
      }
    ]

    const positionCalculator = new NodePositionCalculator({
      connectionDirection: 'horizontal',
      groupPadding: 20,
      nodeWidth: 140,
      nodeHeight: 80,
      horizontalSpacing: 20,
      verticalSpacing: 20
    })

    positionCalculator.registerServices(services)

    const albPosition = positionCalculator.calculatePosition('compute/alb')
    const ecsPosition = positionCalculator.calculatePosition('compute/ecs-inventory')

    console.log('ALB position:', albPosition)
    console.log('ECS position:', ecsPosition)

    // ALB should be in first column (no incoming internal connections)
    expect(albPosition.x).toBe(20) // groupPadding only

    // ECS should be in second column (incoming from ALB)
    expect(ecsPosition.x).toBe(20 + 140 + 20) // groupPadding + nodeWidth + horizontalSpacing = 180
  })

  it('should handle the exact real-world scenario from the application', () => {
    // Test the exact scenario causing problems: viewing compute group
    const computeServices: ServiceDefinition[] = [
      {
        groupName: 'compute',
        identifier: 'alb',
        friendlyName: 'Application Load Balancer',
        serviceType: ServiceType.ALB,
        outgoingConnections: [
          { targetIdentifier: 'compute/ecs-inventory', connectionType: ConnectionType.CALLS, description: 'Routes requests' },
          { targetIdentifier: 'compute/ecs-notification', connectionType: ConnectionType.CALLS, description: 'Routes requests' }
        ],
        incomingConnections: [
          { targetIdentifier: 'api/lambda-orders', connectionType: ConnectionType.CALLS, description: 'Receives orders' }
        ]
      },
      {
        groupName: 'compute',
        identifier: 'ecs-inventory',
        friendlyName: 'ECS Inventory Service',
        serviceType: ServiceType.ECS,
        outgoingConnections: [
          { targetIdentifier: 'data/dynamodb-products', connectionType: ConnectionType.CALLS, description: 'Queries products' }
        ],
        incomingConnections: [
          { targetIdentifier: 'compute/alb', connectionType: ConnectionType.CALLS, description: 'Receives from ALB' }
        ]
      },
      {
        groupName: 'compute',
        identifier: 'ecs-notification',
        friendlyName: 'ECS Notification Service',
        serviceType: ServiceType.ECS,
        outgoingConnections: [
          { targetIdentifier: 'data/dynamodb-notifications', connectionType: ConnectionType.CALLS, description: 'Stores notifications' }
        ],
        incomingConnections: [
          { targetIdentifier: 'compute/alb', connectionType: ConnectionType.CALLS, description: 'Receives from ALB' }
        ]
      }
    ]

    console.log('\n🔍 TESTING REAL-WORLD SCENARIO:')
    console.log('Services to register:', computeServices.map(s => s.identifier))

    const positionCalculator = new NodePositionCalculator({
      connectionDirection: 'horizontal',
      groupPadding: 20,
      nodeWidth: 140,
      nodeHeight: 80,
      horizontalSpacing: 20,
      verticalSpacing: 20
    })

    positionCalculator.registerServices(computeServices)

    // Check each position
    const albPosition = positionCalculator.calculatePosition('compute/alb')
    const ecsInventoryPosition = positionCalculator.calculatePosition('compute/ecs-inventory')
    const ecsNotificationPosition = positionCalculator.calculatePosition('compute/ecs-notification')

    console.log('🎯 ACTUAL POSITIONS:')
    console.log('ALB:', albPosition)
    console.log('ECS Inventory:', ecsInventoryPosition)
    console.log('ECS Notification:', ecsNotificationPosition)

    // ALB should be layer 0 (no internal incoming connections)
    expect(albPosition.x).toBe(20) // First column

    // ECS services should be layer 1 (incoming from ALB internally)
    expect(ecsInventoryPosition.x).toBe(180) // Second column
    expect(ecsNotificationPosition.x).toBe(180) // Second column

    // Test API service in its own group
    const apiServices: ServiceDefinition[] = [
      {
        groupName: 'api',
        identifier: 'lambda-orders',
        friendlyName: 'Order Processing Lambda',
        serviceType: ServiceType.LAMBDA,
        outgoingConnections: [
          { targetIdentifier: 'compute/alb', connectionType: ConnectionType.CALLS, description: 'Sends orders' },
          { targetIdentifier: 'data/dynamodb-orders', connectionType: ConnectionType.CALLS, description: 'Stores orders' }
        ],
        incomingConnections: [
          { targetIdentifier: 'api/api-gateway', connectionType: ConnectionType.CALLS, description: 'Receives API calls' }
        ]
      }
    ]

    const apiCalculator = new NodePositionCalculator({
      connectionDirection: 'horizontal',
      groupPadding: 20,
      nodeWidth: 140,
      nodeHeight: 80,
      horizontalSpacing: 20,
      verticalSpacing: 20
    })

    apiCalculator.registerServices(apiServices)
    const lambdaPosition = apiCalculator.calculatePosition('api/lambda-orders')

    console.log('Lambda Orders position:', lambdaPosition)

    // Lambda should be layer 0 in its own group (no internal incoming connections)
    expect(lambdaPosition.x).toBe(20) // First column
  })
})