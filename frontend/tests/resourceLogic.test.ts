import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resourceService } from '~/services/ResourceService'
import yaml from 'js-yaml'

describe('ResourceService logic', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Reset private state of resourceService if possible, 
    // but since it's a singleton we might need to be careful
  })

  it('should calculate incoming connections correctly', async () => {
    const mockFetch = vi.fn().mockImplementation((path: string) => {
      if (path.includes('group-info.yaml')) {
        return Promise.resolve({ text: () => Promise.resolve('name: Test\nteamId: team1') })
      }
      if (path.includes('lambda-users.yaml')) {
        return Promise.resolve({ 
          text: () => Promise.resolve(yaml.dump({
            friendlyName: 'Users Lambda',
            serviceType: 'LAMBDA',
            outgoingConnections: [
              { targetIdentifier: 'data/dynamodb-users', connectionType: 'CALLS', description: 'Query users' }
            ]
          })) 
        })
      }
      if (path.includes('dynamodb-users.yaml')) {
        return Promise.resolve({ 
          text: () => Promise.resolve(yaml.dump({
            friendlyName: 'Users Table',
            serviceType: 'DYNAMODB'
          })) 
        })
      }
      return Promise.resolve({ text: () => Promise.resolve('') })
    })
    
    global.fetch = mockFetch

    // We need to trigger loading
    const allServices = await resourceService.getAllServices()
    
    // Test contextual incoming (visible from api to data)
    const dataServices = await resourceService.getServicesByGroupWithContext('data', allServices)
    const usersTable = dataServices.find(s => s.identifier === 'dynamodb-users')
    
    expect(usersTable).toBeDefined()
    expect(usersTable?.incomingConnections).toBeDefined()
    expect(usersTable?.incomingConnections?.length).toBe(1)
    expect(usersTable?.incomingConnections?.[0].targetIdentifier).toBe('api/lambda-users')
  })
})
