// Simple test to validate graph building logic
import { describe, it, expect } from 'vitest'

// Mock data that matches your actual YAML structure
const mockServices = {
  compute: [
    {
      friendlyName: "ECS Inventory Service",
      serviceType: "ECS",
      identifier: "ecs-inventory",
      groupName: "compute",
      outgoingConnections: [
        { targetIdentifier: "data/rds-postgres", connectionType: "TCP", description: "Database connection" },
        { targetIdentifier: "data/redis", connectionType: "TCP", description: "Cache connection" }
      ],
      incomingConnections: []
    },
    {
      friendlyName: "ECS Notification Service", 
      serviceType: "ECS",
      identifier: "ecs-notification",
      groupName: "compute",
      outgoingConnections: [
        { targetIdentifier: "data/redis", connectionType: "TCP", description: "Cache connection" }
      ],
      incomingConnections: []
    },
    {
      friendlyName: "Application Load Balancer",
      serviceType: "ALB", 
      identifier: "alb",
      groupName: "compute",
      outgoingConnections: [
        { targetIdentifier: "compute/ecs-inventory", connectionType: "TCP", description: "Route to inventory" },
        { targetIdentifier: "compute/ecs-notification", connectionType: "TCP", description: "Route to notification" }
      ],
      incomingConnections: []
    }
  ],
  data: [
    {
      friendlyName: "Redis Cache Server",
      serviceType: "VALKEY",
      identifier: "redis", 
      groupName: "data",
      outgoingConnections: [],
      incomingConnections: []
    },
    {
      friendlyName: "PostgreSQL Database",
      serviceType: "RDS",
      identifier: "rds-postgres",
      groupName: "data", 
      outgoingConnections: [],
      incomingConnections: []
    }
  ],
  api: [
    {
      friendlyName: "Lambda Products Service",
      serviceType: "LAMBDA",
      identifier: "lambda-products",
      groupName: "api",
      outgoingConnections: [
        { targetIdentifier: "data/redis", connectionType: "TCP", description: "Cache connection" }
      ],
      incomingConnections: []
    }
  ]
}

describe('Graph Building Logic', () => {
  it('should create correct number of target handles for Redis when viewing compute group', () => {
    // Simulate viewing the compute group
    const currentGroup = "compute"
    const servicesInCurrentGroup = mockServices.compute
    const allServices = mockServices
    
    // Track target handles like the real implementation
    const targetHandleCounters = new Map()
    const edges = []
    const externalGroups = new Set()
    
    console.log('\n=== Testing Graph Building Logic ===')
    console.log(`Viewing group: ${currentGroup}`)
    console.log(`Services in group:`, servicesInCurrentGroup.map(s => s.identifier))
    
    // Step 1: Process outgoing connections (like processServiceConnections)
    console.log('\n--- Processing Outgoing Connections ---')
    servicesInCurrentGroup.forEach(service => {
      const serviceId = `${service.groupName}/${service.identifier}`
      console.log(`\nProcessing outgoing connections for ${serviceId}:`)
      
      if (service.outgoingConnections) {
        service.outgoingConnections.forEach(connection => {
          const targetId = connection.targetIdentifier
          const targetGroupName = targetId.split('/')[0]
          
          console.log(`  Connection: ${serviceId} -> ${targetId} (group: ${targetGroupName})`)
          
          // Mark external groups as visible
          if (targetGroupName !== currentGroup) {
            externalGroups.add(targetGroupName)
            console.log(`    Added external group: ${targetGroupName}`)
          }
          
          // Create target handle (this is where the dots come from!)
          const currentHandleIndex = targetHandleCounters.get(targetId) || 0
          const targetHandle = `input-${currentHandleIndex}`
          targetHandleCounters.set(targetId, currentHandleIndex + 1)
          
          console.log(`    Created target handle: ${targetHandle} for ${targetId}`)
          
          // Create edge
          edges.push({
            id: `${serviceId}-${targetId}`,
            source: serviceId,
            target: targetId,
            targetHandle: targetHandle
          })
        })
      }
    })
    
    console.log('\n--- Results After Outgoing Connections ---')
    console.log('External groups found:', Array.from(externalGroups))
    console.log('Target handle counters:', Object.fromEntries(targetHandleCounters))
    console.log('Edges created:', edges.length)
    
    // Step 2: Check Redis specifically
    const redisHandleCount = targetHandleCounters.get('data/redis') || 0
    console.log(`\nRedis (data/redis) has ${redisHandleCount} target handles`)
    
    // Step 3: Now test what happens if we had global incoming connections
    console.log('\n--- Testing with Global Incoming Connections ---')
    const redisWithGlobalIncoming = {
      ...mockServices.data.find(s => s.identifier === 'redis'),
      incomingConnections: [
        { targetIdentifier: "compute/ecs-inventory", connectionType: "TCP", description: "test" },
        { targetIdentifier: "compute/ecs-notification", connectionType: "TCP", description: "test" },
        { targetIdentifier: "api/lambda-products", connectionType: "TCP", description: "test" }
      ]
    }
    console.log('Redis with global incoming connections:', redisWithGlobalIncoming.incomingConnections.length)
    
    // Step 4: What happens if allServices had global incoming connections?
    const allServicesWithGlobal = {
      ...mockServices,
      data: mockServices.data.map(s => 
        s.identifier === 'redis' ? redisWithGlobalIncoming : s
      )
    }
    
    console.log('This might be why we see 3 handles in the real app!')
    
    // The test assertion
    expect(redisHandleCount).toBe(2) // Should only be 2 (from compute services), not 3
    
    console.log('\n=== Test Complete ===\n')
  })
})