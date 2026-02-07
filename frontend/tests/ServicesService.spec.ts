import { describe, it, expect, vi, beforeEach } from 'vitest'

const resourceServiceMock = {
  getGroup: vi.fn()
}

vi.mock('~/services/ResourceService', () => ({
  resourceService: resourceServiceMock
}))

async function createServicesService(files: Record<string, string>) {
  vi.resetModules()
  resourceServiceMock.getGroup.mockReset()
  const module = await import('~/services/ServicesService')
  module.__setServiceFileMocks(files)
  return module.servicesService
}

describe('ServicesService', () => {
  beforeEach(() => {
    resourceServiceMock.getGroup.mockReset()
  })

  it('loads a single service definition by group and identifier', async () => {
    const service = await createServicesService({
      '../public/services/api/gateway.yaml': `\nfriendlyName: API Gateway\nserviceType: API_GATEWAY\ndescription: Main entry\n`
    })

    const result = await service.getService('api', 'gateway')

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
    const service = await createServicesService({
      '../public/services/api/gateway.yaml': `\nfriendlyName: API Gateway\nserviceType: API_GATEWAY\n`,
      '../public/services/api/users.yaml': `\nfriendlyName: Users\nserviceType: LAMBDA\n`,
      '../public/services/data/warehouse.yaml': `\nfriendlyName: Warehouse\nserviceType: REDSHIFT\n`
    })

    const services = await service.getServicesByGroup('api')

    expect(services.map(s => s.identifier).sort()).toEqual(['gateway', 'users'])
  })

  it('returns null for unknown services', async () => {
    const service = await createServicesService({})
    const result = await service.getService('api', 'missing')
    expect(result).toBeNull()
  })

  it('returns external services grouped by target group', async () => {
    resourceServiceMock.getGroup.mockResolvedValue({
      name: 'Data Platform',
      description: 'data team',
      teamId: 'data',
      groupName: 'data'
    })

    const service = await createServicesService({
      '../public/services/api/gateway.yaml': `
friendlyName: API Gateway
serviceType: API_GATEWAY
outgoingConnections:
  - connectionType: CALLS
    targetIdentifier: data/warehouse
    description: Calls warehouse
`,
      '../public/services/api/payments.yaml': `
friendlyName: Payments
serviceType: LAMBDA
outgoingConnections:
  - connectionType: CALLS
    targetIdentifier: data/warehouse
    description: Uses warehouse
`
      ,
      '../public/services/data/warehouse.yaml': `
friendlyName: Warehouse
serviceType: REDSHIFT
`
    })

    const result = await service.getExternalServicesForGroup('api')

    expect(resourceServiceMock.getGroup).toHaveBeenCalledWith('data')
    expect(result).toHaveLength(1)
    expect(result[0].group).toEqual(
      expect.objectContaining({ groupName: 'data' })
    )
    expect(result[0].services).toHaveLength(1)
    expect(result[0].services[0]).toEqual(
      expect.objectContaining({ identifier: 'warehouse', groupName: 'data' })
    )
  })

  it('rejects legacy brace-based target identifiers', async () => {
    const service = await createServicesService({
      '../public/services/api/gateway.yaml': `
friendlyName: API Gateway
serviceType: API_GATEWAY
outgoingConnections:
  - connectionType: CALLS
    targetIdentifier: warehouse{data}
    description: Calls warehouse
`
    })

    await expect(service.getServicesByGroup('api')).rejects.toThrow(
      "Invalid targetIdentifier for gateway connection 0: legacy 'service{group}' format is not supported"
    )
  })
})
