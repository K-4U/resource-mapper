import { describe, it, expect } from 'vitest'

describe('Group Positioning Logic', () => {
  it('should position groups correctly based on connection direction', () => {
    // Mock the positioning logic that determines group placement
    function determineGroupPosition(
      groupServices: any[],
      incomingSources: Set<string>,
      outgoingTargets: Set<string>
    ): { x: number; side: 'left' | 'center' | 'right' } {
      
      const hasIncomingSources = groupServices.some(service => 
        incomingSources.has(`${service.groupName}/${service.identifier}`)
      )
      const hasOutgoingTargets = groupServices.some(service => 
        outgoingTargets.has(`${service.groupName}/${service.identifier}`)
      )

      // Position based on relationship type
      if (hasIncomingSources && !hasOutgoingTargets) {
        // Pure incoming sources go to the left
        return { x: 50, side: 'left' }
      } else if (hasOutgoingTargets && !hasIncomingSources) {
        // Pure outgoing targets go to the right  
        return { x: 950, side: 'right' }
      } else {
        // Mixed relationship - place based on which is more dominant
        const incomingCount = groupServices.filter(service => 
          incomingSources.has(`${service.groupName}/${service.identifier}`)
        ).length
        const outgoingCount = groupServices.filter(service => 
          outgoingTargets.has(`${service.groupName}/${service.identifier}`)  
        ).length
        
        if (incomingCount > outgoingCount) {
          return { x: 50, side: 'left' }  // More incoming - place left
        } else {
          return { x: 950, side: 'right' } // More outgoing or equal - place right
        }
      }
    }

    // Test scenario: API group with lambda-products that connects TO compute
    const apiServices = [
      { groupName: 'api', identifier: 'lambda-products' },
      { groupName: 'api', identifier: 'api-gateway' }
    ]
    
    const incomingSources = new Set<string>()
    const outgoingTargets = new Set(['api/lambda-products']) // This service is a target of compute connections
    
    const position = determineGroupPosition(apiServices, incomingSources, outgoingTargets)
    
    // API group should be positioned on the right since compute connects TO it
    expect(position.side).toBe('right')
    expect(position.x).toBe(950)
  })

  it('should position incoming services on the left', () => {
    function determineGroupPosition(
      groupServices: any[],
      incomingSources: Set<string>,
      outgoingTargets: Set<string>
    ): { x: number; side: 'left' | 'center' | 'right' } {
      
      const hasIncomingSources = groupServices.some(service => 
        incomingSources.has(`${service.groupName}/${service.identifier}`)
      )
      const hasOutgoingTargets = groupServices.some(service => 
        outgoingTargets.has(`${service.groupName}/${service.identifier}`)
      )

      if (hasIncomingSources && !hasOutgoingTargets) {
        return { x: 50, side: 'left' }
      } else if (hasOutgoingTargets && !hasIncomingSources) {
        return { x: 950, side: 'right' }
      } else {
        const incomingCount = groupServices.filter(service => 
          incomingSources.has(`${service.groupName}/${service.identifier}`)
        ).length
        const outgoingCount = groupServices.filter(service => 
          outgoingTargets.has(`${service.groupName}/${service.identifier}`)  
        ).length
        
        if (incomingCount > outgoingCount) {
          return { x: 50, side: 'left' }
        } else {
          return { x: 950, side: 'right' }
        }
      }
    }

    // Test scenario: External service that sends data TO the current group
    const externalServices = [
      { groupName: 'external', identifier: 'external-api' }
    ]
    
    const incomingSources = new Set(['external/external-api']) // This service sends TO current group
    const outgoingTargets = new Set<string>()
    
    const position = determineGroupPosition(externalServices, incomingSources, outgoingTargets)
    
    // External service should be positioned on the left since it sends TO current group
    expect(position.side).toBe('left')
    expect(position.x).toBe(50)
  })

  it('should calculate proper group dimensions based on services', () => {
    // Mock a simple group dimension calculation
    function calculateGroupDimensions(services: any[]): { width: number; height: number } {
      if (services.length === 0) {
        return { width: 200, height: 150 }
      }

      // Find the bounds of all services
      let maxX = 0
      let maxY = 0
      
      services.forEach(service => {
        const serviceRight = service.position.x + 140 // nodeWidth
        const serviceBottom = service.position.y + 80 // nodeHeight
        
        maxX = Math.max(maxX, serviceRight)
        maxY = Math.max(maxY, serviceBottom)
      })

      // Add padding around the services
      const padding = 30
      return {
        width: Math.max(200, maxX + padding),
        height: Math.max(150, maxY + padding)
      }
    }

    // Test with multiple services at different positions
    const services = [
      { position: { x: 20, y: 50 } },  // Top-left service
      { position: { x: 190, y: 50 } }, // Top-right service  
      { position: { x: 20, y: 170 } }  // Bottom-left service
    ]

    const dimensions = calculateGroupDimensions(services)
    
    // Should accommodate the rightmost service (190 + 140 + 30 = 360)
    expect(dimensions.width).toBe(360)
    // Should accommodate the bottommost service (170 + 80 + 30 = 280)
    expect(dimensions.height).toBe(280)
  })

  it('should provide minimum dimensions for empty groups', () => {
    function calculateGroupDimensions(services: any[]): { width: number; height: number } {
      if (services.length === 0) {
        return { width: 200, height: 150 }
      }
      return { width: 300, height: 200 } // Mock for non-empty
    }

    const emptyGroup = calculateGroupDimensions([])
    
    expect(emptyGroup.width).toBe(200)
    expect(emptyGroup.height).toBe(150)
  })
})