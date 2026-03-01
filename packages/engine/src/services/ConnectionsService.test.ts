import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConnectionsService } from './ConnectionsService.js'
import { ServicesService } from './ServicesService.js'
import type { ServiceConnection, GroupConnection } from '@k-4u/resource-mapper-shared'

const servicePath = (groupId: string, file: string) => `services/${groupId}/${file}.yaml`

const baseMocks: Record<string, string> = {
  [servicePath('api', 'gateway')]: `friendlyName: API Gateway\nserviceType: API_GATEWAY\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: data/warehouse\n    description: Calls warehouse\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Calls site\n`,
  [servicePath('data', 'warehouse')]: `friendlyName: Warehouse\nserviceType: REDSHIFT\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Publishes reports\n`,
  [servicePath('frontend', 'site')]: 'friendlyName: Frontend\nserviceType: LAMBDA\n'
}

const selfLoopMocks: Record<string, string> = {
  ...baseMocks,
  [servicePath('frontend', 'site')]: `friendlyName: Frontend\nserviceType: LAMBDA\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Self ping\n`
}

const multiCountMocks: Record<string, string> = {
  ...baseMocks,
  [servicePath('api', 'processor')]: `friendlyName: API Processor\nserviceType: LAMBDA\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: frontend/site\n    description: Secondary path\n`
}

let servicesService: ServicesService
let connectionsService: ConnectionsService

function resetMocks(mocks = baseMocks) {
  servicesService.setFileMocks(mocks)
  connectionsService = new ConnectionsService(servicesService)
}

describe('ConnectionsService', () => {
  beforeEach(() => {
    const groupServiceMock = { getGroup: vi.fn() }
    servicesService = new ServicesService({}, groupServiceMock as any)
    connectionsService = new ConnectionsService(servicesService)
    resetMocks()
  })

  it('returns outgoing connections for a service', async () => {
    const connections = await connectionsService.getConnectionsFromService('api/gateway')
    expect(connections).toHaveLength(2)
    expect(
      connections
        .map((conn: ServiceConnection) => `${conn.targetService.groupId}/${conn.targetService.serviceId}`)
        .sort()
    ).toEqual(['data/warehouse', 'frontend/site'])
  })

  it('returns incoming connections for a service', async () => {
    const connections = await connectionsService.getConnectionsToService('frontend/site')
    expect(connections).toHaveLength(2)
    expect(
      connections
        .map((conn: ServiceConnection) => `${conn.startService.groupId}/${conn.startService.serviceId}`)
        .sort()
    ).toEqual(['api/gateway', 'data/warehouse'])
  })

  it('returns outgoing connections for a group', async () => {
    const connections = await connectionsService.getConnectionsFromGroup('api')
    expect(connections).toHaveLength(2)
    expect(new Set(connections.map((conn: GroupConnection) => conn.sourceGroup))).toEqual(new Set(['api']))
    expect(new Set(connections.map((conn: GroupConnection) => conn.targetGroup))).toEqual(new Set(['data', 'frontend']))
  })

  it('returns incoming connections for a group', async () => {
    const connections = await connectionsService.getConnectionsToGroup('frontend')
    expect(connections).toHaveLength(2)
    expect(new Set(connections.map((conn: GroupConnection) => conn.targetGroup))).toEqual(new Set(['frontend']))
    expect(new Set(connections.map((conn: GroupConnection) => conn.sourceGroup))).toEqual(new Set(['api', 'data']))
  })

  it('filters self-loop connections by default but can include them', async () => {
    resetMocks(selfLoopMocks)
    const withoutSelf = await connectionsService.getConnectionsFromGroup('frontend')
    expect(withoutSelf).toHaveLength(0)

    const withSelf = await connectionsService.getConnectionsFromGroup('frontend', true)
    expect(withSelf).toHaveLength(1)
    expect(withSelf[0]?.sourceGroup).toBe('frontend')
    expect(withSelf[0]?.targetGroup).toBe('frontend')
  })

  it('aggregates group connections with accurate counts', async () => {
    resetMocks(multiCountMocks)
    const summary = await connectionsService.getAllGroupConnections()
    const lookup = summary.reduce<Record<string, number>>((acc: Record<string, number>, edge: GroupConnection) => {
      acc[`${edge.sourceGroup}->${edge.targetGroup}`] = edge.connectionCount
      return acc
    }, {})

    expect(lookup['api->data']).toBe(1)
    expect(lookup['api->frontend']).toBe(2)
    expect(lookup['data->frontend']).toBe(1)
  })
})
