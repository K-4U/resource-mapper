import { describe, it, expect, beforeEach } from 'vitest'
import { connectionsService } from '~/services/ConnectionsService'
import { __setServiceFileMocks } from '~/services/ServicesService'

const baseMocks: Record<string, string> = {
  '../public/services/api/gateway.yaml': `\nfriendlyName: API Gateway\nserviceType: API_GATEWAY\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: data/warehouse\n    description: Calls warehouse\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Calls site\n`,
  '../public/services/data/warehouse.yaml': `\nfriendlyName: Warehouse\nserviceType: REDSHIFT\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Publishes reports\n`,
  '../public/services/frontend/site.yaml': `\nfriendlyName: Frontend\nserviceType: LAMBDA\n`
}

const selfLoopMocks: Record<string, string> = {
  ...baseMocks,
  '../public/services/frontend/site.yaml': `\nfriendlyName: Frontend\nserviceType: LAMBDA\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Self ping\n`
}

const multiCountMocks: Record<string, string> = {
  ...baseMocks,
  '../public/services/api/processor.yaml': `\nfriendlyName: API Processor\nserviceType: LAMBDA\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Secondary path\n`
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

  it('filters self-loop connections by default but can include them when requested', async () => {
    resetMocks(selfLoopMocks)
    const withoutSelf = await connectionsService.getConnectionsFromGroup('frontend')
    expect(withoutSelf).toHaveLength(0)

    const withSelf = await connectionsService.getConnectionsFromGroup('frontend', true)
    expect(withSelf).toHaveLength(1)
    expect(withSelf[0]?.targetService).toBe('frontend/site')
  })

  it('aggregates group connections with accurate counts', async () => {
    resetMocks(multiCountMocks)
    const summary = await connectionsService.getAllGroupConnections()
    const lookup = summary.reduce<Record<string, number>>((acc, edge) => {
      acc[`${edge.sourceGroup}->${edge.targetGroup}`] = edge.connectionCount
      return acc
    }, {})

    expect(lookup['api->data']).toBe(1)
    expect(lookup['api->frontend']).toBe(2)
    expect(lookup['data->frontend']).toBe(1)
  })
})
