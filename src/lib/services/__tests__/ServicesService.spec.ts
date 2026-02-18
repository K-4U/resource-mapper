import { beforeEach, describe, expect, it, vi } from 'vitest'

const resourceServiceMock = vi.hoisted(() => ({
  getGroup: vi.fn()
}))

vi.mock('$lib/services/ResourceService', () => ({
  resourceService: resourceServiceMock
}))

import { __setServiceFileMocks, servicesService } from '$lib/services/ServicesService'

const servicePath = (groupId: string, file: string) => `../../../data/services/${groupId}/${file}.yaml`

describe('ServicesService', () => {
  beforeEach(() => {
    __setServiceFileMocks({})
    resourceServiceMock.getGroup.mockReset()
  })

  it('loads a single service definition by group and identifier', async () => {
    __setServiceFileMocks({
      [servicePath('api', 'gateway')]: 'friendlyName: API Gateway\nserviceType: API_GATEWAY\ndescription: Main entry\n'
    })

    const result = await servicesService.getService('api', 'gateway')

    expect(result).toEqual(
      expect.objectContaining({
        groupName: 'api',
        identifier: 'gateway',
        friendlyName: 'API Gateway',
        serviceType: 'API_GATEWAY',
        description: 'Main entry'
      })
    )
  })

  it('returns all services for a group', async () => {
    __setServiceFileMocks({
      [servicePath('api', 'gateway')]: 'friendlyName: API Gateway\nserviceType: API_GATEWAY\n',
      [servicePath('api', 'users')]: 'friendlyName: Users\nserviceType: LAMBDA\n',
      [servicePath('data', 'warehouse')]: 'friendlyName: Warehouse\nserviceType: REDSHIFT\n'
    })

    const services = await servicesService.getServicesByGroup('api')

    expect(services.map(s => s.identifier).sort()).toEqual(['gateway', 'users'])
  })

  it('returns null for unknown services', async () => {
    const result = await servicesService.getService('api', 'missing')
    expect(result).toBeNull()
  })

  it('returns external services grouped by direction', async () => {
    resourceServiceMock.getGroup.mockImplementation(async (groupId: string) => ({
      name: groupId.toUpperCase(),
      description: `${groupId} description`,
      teamId: groupId,
      groupName: groupId
    }))

    __setServiceFileMocks({
      [servicePath('api', 'gateway')]: `friendlyName: API Gateway\nserviceType: API_GATEWAY\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: data/warehouse\n    description: Calls warehouse\n`,
      [servicePath('api', 'payments')]: 'friendlyName: Payments\nserviceType: LAMBDA\n',
      [servicePath('data', 'warehouse')]: `friendlyName: Warehouse\nserviceType: REDSHIFT\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: api/payments\n    description: Calls payments\n`
    })

    const result = await servicesService.getExternalServicesForGroup('api')

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          direction: 'outgoing',
          group: expect.objectContaining({ groupName: 'data' }),
          services: expect.arrayContaining([expect.objectContaining({ identifier: 'warehouse' })])
        }),
        expect.objectContaining({
          direction: 'incoming',
          group: expect.objectContaining({ groupName: 'data' }),
          services: expect.arrayContaining([expect.objectContaining({ identifier: 'warehouse' })])
        })
      ])
    )
  })

  it('populates incoming connections on target services', async () => {
    __setServiceFileMocks({
      [servicePath('api', 'payments')]: 'friendlyName: Payments\nserviceType: LAMBDA\n',
      [servicePath('data', 'warehouse')]: `friendlyName: Warehouse\nserviceType: REDSHIFT\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: api/payments\n    description: Calls payments\n`
    })

    const payments = await servicesService.getService('api', 'payments')

    expect(payments?.incomingConnections).toEqual([
      expect.objectContaining({
        connectionType: 'CALLS',
        sourceIdentifier: { groupId: 'data', serviceId: 'warehouse' },
        description: 'Calls payments'
      })
    ])
  })

  it("rejects legacy brace-based target identifiers", async () => {
    __setServiceFileMocks({
      [servicePath('api', 'gateway')]: `friendlyName: API Gateway\nserviceType: API_GATEWAY\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: warehouse{data}\n    description: Calls warehouse\n`
    })

    await expect(servicesService.getServicesByGroup('api')).rejects.toThrow(
      "Invalid targetIdentifier for gateway connection 0: legacy 'service{group}' format is not supported"
    )
  })
})
