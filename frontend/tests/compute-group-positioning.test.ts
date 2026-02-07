import { describe, it, expect, beforeEach } from 'vitest'
import { NodePositionCalculator } from '~/composables/useNodePositioning'
import { useGroupGraph } from '~/composables/useGroupGraph'
import type { ServiceDefinition } from '~/types'
import { ConnectionType, ServiceType } from '~/types'

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

  it('should handle the Order Processing Lambda positioning issue', () => {
    // Test the specific scenario mentioned by the user
    const apiServices: ServiceDefinition[] = [
      {
        groupName: 'api',
        identifier: 'lambda-orders',
        friendlyName: 'Order Processing Lambda',
        serviceType: ServiceType.LAMBDA,
        outgoingConnections: [
          { targetIdentifier: 'compute/alb', connectionType: ConnectionType.CALLS, description: 'Calls ALB' }
        ],
        incomingConnections: []
      }
    ]

    // Test positioning within the API group (external group)
    const positionCalculator = new NodePositionCalculator({
      connectionDirection: 'horizontal',
      groupPadding: 20,
      nodeWidth: 140,
      nodeHeight: 80,
      horizontalSpacing: 20,
      verticalSpacing: 20
    })

    positionCalculator.registerServices(apiServices)
    const lambdaPosition = positionCalculator.calculatePosition('api/lambda-orders')

    console.log('Order Processing Lambda position in API group:', lambdaPosition)

    // Lambda should be in first column within its group (no incoming internal connections)
    expect(lambdaPosition.x).toBe(20) // Should be at groupPadding, not pushed to the right
  })
})

// Mock data for testing
const computeServices: ServiceDefinition[] = [
  {
        groupName: 'compute',
        identifier: 'alb',
        friendlyName: 'Application Load Balancer',
        serviceType: ServiceType.ALB,
        outgoingConnections: [
          { targetIdentifier: 'compute/ecs-inventory', connectionType: ConnectionType.CALLS, description: 'Routes to inventory' },
          { targetIdentifier: 'compute/ecs-notification', connectionType: ConnectionType.CALLS, description: 'Routes to notification' }
        ],
        incomingConnections: [
          { targetIdentifier: 'api/lambda-orders', connectionType: ConnectionType.CALLS, description: 'Lambda to ALB' }
        ]
      },
      {
        groupName: 'compute',
        identifier: 'ecs-inventory',
        friendlyName: 'ECS Inventory Service',
        serviceType: ServiceType.ECS,
        outgoingConnections: [
          { targetIdentifier: 'data/dynamodb-products', connectionType: ConnectionType.CALLS, description: 'Products DB' },
          { targetIdentifier: 'data/redis', connectionType: ConnectionType.CALLS, description: 'Redis cache' }
        ],
        incomingConnections: [
          { targetIdentifier: 'compute/alb', connectionType: ConnectionType.CALLS, description: 'ALB routes' }
        ]
      },
      {
        groupName: 'compute',
        identifier: 'ecs-notification',
        friendlyName: 'ECS Notification Service',
        serviceType: ServiceType.ECS,
        outgoingConnections: [
          { targetIdentifier: 'data/dynamodb-notifications', connectionType: ConnectionType.CALLS, description: 'Notifications DB' }
        ],
        incomingConnections: [
          { targetIdentifier: 'compute/alb', connectionType: ConnectionType.CALLS, description: 'ALB routes' }
        ]
      },
    ]

    // Mock external services that connect to compute group
    const apiServices: ServiceDefinition[] = [
      {
        groupName: 'api',
        identifier: 'lambda-orders',
        friendlyName: 'Order Processing Lambda',
        serviceType: ServiceType.LAMBDA,
        outgoingConnections: [
          { targetIdentifier: 'compute/alb', connectionType: ConnectionType.CALLS, description: 'ALB calls' },
          { targetIdentifier: 'data/dynamodb-orders', connectionType: ConnectionType.CALLS, description: 'Orders DB' }
        ],
        incomingConnections: []
      },
      {
        groupName: 'api',
        identifier: 'api-gateway',
        friendlyName: 'API Gateway',
        serviceType: ServiceType.API_GATEWAY,
        outgoingConnections: [
          { targetIdentifier: 'api/lambda-orders', connectionType: ConnectionType.CALLS, description: 'Lambda calls' }
        ],
        incomingConnections: []
      }
    ]

    const dataServices: ServiceDefinition[] = [
      {
        groupName: 'data',
        identifier: 'dynamodb-products',
        friendlyName: 'DynamoDB Products Table',
        serviceType: ServiceType.DYNAMODB,
        outgoingConnections: [],
        incomingConnections: [
          { targetIdentifier: 'compute/ecs-inventory', connectionType: ConnectionType.CALLS, description: 'ECS inventory access' }
        ]
      },
      {
        groupName: 'data',
        identifier: 'redis',
        friendlyName: 'Redis Cache',
        serviceType: ServiceType.VALKEY,  // VALKEY is the Redis equivalent in the enum
        outgoingConnections: [],
        incomingConnections: [
          { targetIdentifier: 'compute/ecs-inventory', connectionType: ConnectionType.CALLS, description: 'ECS inventory caching' }
        ]
      },
      {
        groupName: 'data',
        identifier: 'dynamodb-notifications',
        friendlyName: 'DynamoDB Notifications Table',
        serviceType: ServiceType.DYNAMODB,
        outgoingConnections: [],
        incomingConnections: [
          { targetIdentifier: 'compute/ecs-notification', connectionType: ConnectionType.CALLS, description: 'ECS notification storage' }
        ]
      }
    ]

let allServices: Record<string, ServiceDefinition[]>

describe('Additional Compute Group Tests', () => {
  beforeEach(() => {
    allServices = {
      compute: computeServices,
      api: apiServices,
      data: dataServices
    }
  })

  it('should position ALB in the first column (not right edge)', () => {
    const { buildGraph } = useGroupGraph()
    const { nodes } = buildGraph(
      computeServices,
      allServices,
      'compute',
      'Compute',
      false, // hideIncomingConnections
      false  // hideExternalToExternal
    )

    // Find the ALB service node
    const albNode = nodes.find(n => 
      n.type === 'service' && 
      n.id === 'compute/alb'
    )

    expect(albNode).toBeDefined()
    expect(albNode!.position.x).toBeLessThan(100) // Should be in first column, not pushed to right
    console.log('ALB position:', albNode!.position)
  })

  it('should position Order Processing Lambda on the left (incoming source)', () => {
    const { buildGraph } = useGroupGraph()
    const { nodes } = buildGraph(
      computeServices,
      allServices,
      'compute',
      'Compute',
      false,
      false
    )

    // Find the external API group
    const apiGroup = nodes.find(n => 
      n.type === 'external-group' && 
      n.data?.groupName === 'api'
    )

    expect(apiGroup).toBeDefined()
    expect(apiGroup!.position.x).toBeLessThan(500) // Should be on the left (incoming source)
    console.log('API group position:', apiGroup!.position)

    // Find the Order Processing Lambda within the API group
    const orderLambdaNode = nodes.find(n => 
      n.type === 'service' && 
      n.id === 'api/lambda-orders' &&
      n.parentNode === apiGroup!.id
    )

    expect(orderLambdaNode).toBeDefined()
    expect(orderLambdaNode!.position.x).toBeLessThan(100) // Should be in first column within its group
    console.log('Order Lambda position within API group:', orderLambdaNode!.position)
  })

  it('should position Data group on the right (outgoing target)', () => {
    const { buildGraph } = useGroupGraph()
    const { nodes } = buildGraph(
      computeServices,
      allServices,
      'compute',
      'Compute',
      false,
      false
    )

    // Find the external Data group
    const dataGroup = nodes.find(n => 
      n.type === 'external-group' && 
      n.data?.groupName === 'data'
    )

    expect(dataGroup).toBeDefined()
    expect(dataGroup!.position.x).toBeGreaterThan(500) // Should be on the right (outgoing target)
    console.log('Data group position:', dataGroup!.position)
  })

  it('should have proper column spacing within compute group', () => {
    const { buildGraph } = useGroupGraph()
    const { nodes } = buildGraph(
      computeServices,
      allServices,
      'compute',
      'Compute',
      false,
      false
    )

    // Find all compute group service nodes
    const computeServiceNodes = nodes.filter(n => 
      n.type === 'service' && 
      n.parentNode === 'group-compute'
    ).sort((a, b) => a.position.x - b.position.x)

    expect(computeServiceNodes).toHaveLength(3)

    // Check that services are properly spaced in columns
    console.log('Compute service positions:', computeServiceNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y })))

    expect(computeServiceNodes).toHaveLength(3)

    // ALB should be in first column (layer 0 - no incoming internal connections)
    const alb = computeServiceNodes.find(n => n.id === 'compute/alb')
    expect(alb!.position.x).toBe(20) // groupPadding

    // ECS services should be in second column (layer 1 - incoming from ALB)
    const ecsNodes = computeServiceNodes.filter(n => 
      n.id === 'compute/ecs-inventory' || n.id === 'compute/ecs-notification'
    )
    ecsNodes.forEach(node => {
      expect(node.position.x).toBe(20 + 140 + 20) // groupPadding + nodeWidth + horizontalSpacing
    })
  })

  it('should handle visibility toggles correctly', () => {
    const { buildGraph } = useGroupGraph()
    
    // Test with hideIncomingConnections = true
    const { nodes: filteredNodes } = buildGraph(
      computeServices,
      allServices,
      'compute',
      'Compute',
      true, // hideIncomingConnections
      false
    )

    // API group should be hidden since it only has incoming-only connections to compute
    const apiGroup = filteredNodes.find(n => 
      n.type === 'external-group' && 
      n.data?.groupName === 'api'
    )
    expect(apiGroup).toBeUndefined() // Should be filtered out

    // Data group should still be visible (outgoing targets)
    const dataGroup = filteredNodes.find(n => 
      n.type === 'external-group' && 
      n.data?.groupName === 'data'
    )
    expect(dataGroup).toBeDefined()
  })
})