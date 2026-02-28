import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServicesService } from '../ServicesService.js'
import type { ServiceType } from '@mapper/shared'

const resourceServiceMock = vi.hoisted(() => ({
  getGroup: vi.fn()
}))

vi.mock('$lib/services/ResourceService', () => ({
  resourceService: resourceServiceMock
}))

const servicePath = (groupId: string, file: string) => `../../../data/services/${groupId}/${file}.yaml`

let servicesService: ServicesService

function resetMocks(mocks: Record<string, string> = {}) {
  servicesService = new ServicesService()
  servicesService.__setServiceFileMocks(mocks)
}

describe('ServicesService', () => {
  beforeEach(() => {
    resetMocks()
    resourceServiceMock.getGroup.mockReset()
  })

  it('loads a single service definition by group and identifier', async () => {
    servicesService.__setServiceFileMocks({
      [servicePath('api', 'gateway')]: 'friendlyName: API Gateway\nserviceType: API_GATEWAY\ndescription: Main entry\n'
    })

    const result = await servicesService.getService('api', 'gateway')

    expect(result).toEqual(
      expect.objectContaining({
        groupId: 'api',
        identifier: 'gateway',
        friendlyName: 'API Gateway',
        serviceType: 'API_GATEWAY',
        description: 'Main entry'
      })
    )
  })

  it('returns all services for a group', async () => {
    servicesService.__setServiceFileMocks({
      [servicePath('api', 'gateway')]: 'friendlyName: API Gateway\nserviceType: API_GATEWAY\n',
      [servicePath('api', 'users')]: 'friendlyName: Users\nserviceType: LAMBDA\n',
      [servicePath('data', 'warehouse')]: 'friendlyName: Warehouse\nserviceType: REDSHIFT\n'
    })

    const services = await servicesService.getServicesByGroup('api')

    expect(services.map((s: ServiceType) => s.identifier).sort()).toEqual(['gateway', 'users'])
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

    servicesService.__setServiceFileMocks({
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
    servicesService.__setServiceFileMocks({
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

  it('returns both incoming and outgoing entries when the same service has bidirectional links to the same external service', async () => {
    // Same internal service participates in both directions with the same external service
    servicesService.__setServiceFileMocks({
      [servicePath('api', 'lambda-orders')]: `friendlyName: Order Processing Lambda\nserviceType: LAMBDA\noutgoingConnections:\n  - connectionType: TCP\n    targetIdentifier: data/rds-postgres\n    description: orders -> rds\n`,
      [servicePath('data', 'rds-postgres')]: `friendlyName: RDS Postgres\nserviceType: RDS\noutgoingConnections:\n  - connectionType: TCP\n    targetIdentifier: api/lambda-orders\n    description: rds -> orders\n`
    })

    const result = await servicesService.getExternalServicesForGroup('api')

    // Expect one outgoing entry for group 'data' that includes rds-postgres
    const outEntry = result.find((e: any) => e.direction === 'outgoing' && e.group.groupName === 'data')
    expect(outEntry).toBeTruthy()
    expect(outEntry?.services.some((s: any) => s.identifier === 'rds-postgres')).toBe(true)

    // And one incoming entry for group 'data' that includes rds-postgres
    const inEntry = result.find((e: any) => e.direction === 'incoming' && e.group.groupName === 'data')
    expect(inEntry).toBeTruthy()
    expect(inEntry?.services.some((s: any) => s.identifier === 'rds-postgres')).toBe(true)
  })

  it("rejects legacy brace-based target identifiers", async () => {
    servicesService.__setServiceFileMocks({
      [servicePath('api', 'gateway')]: `friendlyName: API Gateway\nserviceType: API_GATEWAY\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: warehouse{data}\n    description: Calls warehouse\n`
    })

    await expect(servicesService.getServicesByGroup('api')).rejects.toThrow(
      "Invalid targetIdentifier for gateway connection 0: legacy 'service{group}' format is not supported"
    )
  })
})
