import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServicesService } from './ServicesService.ts'
import {ExternalGroupServices, ServiceDefinition} from "@resource-mapper/shared";

const groupServiceMock = vi.hoisted(() => ({
  getGroup: vi.fn()
}))

const servicePath = (groupId: string, file: string) => `services/${groupId}/${file}.yaml`

let servicesService: ServicesService

function resetMocks(mocks: Record<string, string> = {}) {
  servicesService = new ServicesService({}, groupServiceMock as any)
  servicesService.setFileMocks(mocks)
}

describe('ServicesService', () => {
  beforeEach(() => {
    resetMocks()
    groupServiceMock.getGroup.mockReset()
  })

  it('loads a single service definition by group and identifier', async () => {
    servicesService.setFileMocks({
      [servicePath('api', 'gateway')]: 'friendlyName: API Gateway\nserviceType: API_GATEWAY\ndescription: Main entry\n'
    })

    // prepare is only needed if incoming connections population is required; call it to be safe
    await servicesService.prepare()

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
    servicesService.setFileMocks({
      [servicePath('api', 'gateway')]: 'friendlyName: API Gateway\nserviceType: API_GATEWAY\n',
      [servicePath('api', 'users')]: 'friendlyName: Users\nserviceType: LAMBDA\n',
      [servicePath('data', 'warehouse')]: 'friendlyName: Warehouse\nserviceType: REDSHIFT\n'
    })

    await servicesService.prepare()
    const services = await servicesService.getServicesByGroup('api')

    expect(services.map((s: any) => s.identifier).sort()).toEqual(['gateway', 'users'])
  })

  it('returns null for unknown services', async () => {
    await servicesService.prepare()
    const result = await servicesService.getService('api', 'missing')
    expect(result).toBeNull()
  })

  it('returns external services grouped by direction', async () => {
    groupServiceMock.getGroup.mockImplementation(async (groupId: string) => ({
      name: groupId.toUpperCase(),
      description: `${groupId} description`,
      teamId: groupId,
      groupName: groupId
    }))

    servicesService.setFileMocks({
      [servicePath('api', 'gateway')]: `friendlyName: API Gateway\nserviceType: API_GATEWAY\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: data/warehouse\n    description: Calls warehouse\n`,
      [servicePath('api', 'payments')]: 'friendlyName: Payments\nserviceType: LAMBDA\n',
      [servicePath('data', 'warehouse')]: `friendlyName: Warehouse\nserviceType: REDSHIFT\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: api/payments\n    description: Calls payments\n`
    })

    await servicesService.prepare()
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
    servicesService.setFileMocks({
      [servicePath('api', 'payments')]: 'friendlyName: Payments\nserviceType: LAMBDA\n',
      [servicePath('data', 'warehouse')]: `friendlyName: Warehouse\nserviceType: REDSHIFT\noutgoingConnections:\n  - connectionType: CALLS\n    targetIdentifier: api/payments\n    description: Calls payments\n`
    })

    await servicesService.prepare()
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
    servicesService.setFileMocks({
      [servicePath('api', 'lambda-orders')]: `friendlyName: Order Processing Lambda\nserviceType: LAMBDA\noutgoingConnections:\n  - connectionType: TCP\n    targetIdentifier: data/rds-postgres\n    description: orders -> rds\n`,
      [servicePath('data', 'rds-postgres')]: `friendlyName: RDS Postgres\nserviceType: RDS\noutgoingConnections:\n  - connectionType: TCP\n    targetIdentifier: api/lambda-orders\n    description: rds -> orders\n`
    })

    await servicesService.prepare()
    const result = await servicesService.getExternalServicesForGroup('api')

    // Expect one outgoing entry for group 'data' that includes rds-postgres
    const outEntry = result.find((e: ExternalGroupServices) => e.direction === 'outgoing' && e.group.groupName === 'data')
    expect(outEntry).toBeTruthy()
    expect(outEntry?.services.some((s: ServiceDefinition) => s.identifier === 'rds-postgres')).toBe(true)

    // And one incoming entry for group 'data' that includes rds-postgres
    const inEntry = result.find((e: ExternalGroupServices) => e.direction === 'incoming' && e.group.groupName === 'data')
    expect(inEntry).toBeTruthy()
    expect(inEntry?.services.some((s: ServiceDefinition) => s.identifier === 'rds-postgres')).toBe(true)
  })

  it("rejects legacy brace-based target identifiers", async () => {
    servicesService.setFileMocks({
      [servicePath('api', 'gateway')]: `friendlyName: API Gateway
serviceType: API_GATEWAY
outgoingConnections:
  - connectionType: CALLS
    targetIdentifier: warehouse{data}
    description: Calls warehouse
    `
    })

    // Validation now occurs during prepare(), so expect prepare() to throw
    await expect(servicesService.prepare()).rejects.toThrow(
      "Invalid targetIdentifier for gateway connection 0: legacy 'service{group}' format is not supported"
    )
  })
})
