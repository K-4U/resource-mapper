import { describe, it, expect, beforeEach } from 'vitest'
import { connectionsService } from '~/services/ConnectionsService'
import { __setServiceFileMocks } from '~/services/ServicesService'

const baseMocks: Record<string, string> = {
  '../public/services/api/gateway.yaml': `\nfriendlyName: API Gateway\nserviceType: API_GATEWAY\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: data/warehouse\n    description: Calls warehouse\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Calls site\n`,
  '../public/services/data/warehouse.yaml': `\nfriendlyName: Warehouse\nserviceType: REDSHIFT\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Publishes reports\n`,
  '../public/services/frontend/site.yaml': `\nfriendlyName: Frontend\nserviceType: LAMBDA\n`
}

function resetMocks(mocks = baseMocks) {
  __setServiceFileMocks(mocks)
  connectionsService.__reset()
}

describe('ConnectionsService', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('returns outgoing connections for a service', async () => {
    const connections = await connectionsService.getConnectionsFromService('api/gateway')
    expect(connections).toHaveLength(2)
    expect(connections.map(conn => conn.targetService).sort()).toEqual([
      'data/warehouse',
      'frontend/site'
    ])
    expect(connections[0].description).toBe('Calls warehouse')
  })

  it('returns incoming connections for a service', async () => {
    const connections = await connectionsService.getConnectionsToService('frontend/site')
    expect(connections).toHaveLength(2)
    expect(connections.map(conn => conn.startService).sort()).toEqual([
      'api/gateway',
      'data/warehouse'
    ])
  })

  it('returns outgoing connections for a group', async () => {
    const connections = await connectionsService.getConnectionsFromGroup('api')
    expect(connections).toHaveLength(2)
    expect(new Set(connections.map(conn => conn.startService))).toEqual(new Set(['api/gateway']))
  })

  it('returns incoming connections for a group', async () => {
    const connections = await connectionsService.getConnectionsToGroup('frontend')
    expect(connections).toHaveLength(2)
    expect(new Set(connections.map(conn => conn.targetService))).toEqual(
      new Set(['frontend/site'])
    )
  })
})
