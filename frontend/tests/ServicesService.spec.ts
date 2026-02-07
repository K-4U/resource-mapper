import { describe, it, expect, vi } from 'vitest'

async function createServicesService(files: Record<string, string>) {
  vi.resetModules()
  const module = await import('~/services/ServicesService')
  module.__setServiceFileMocks(files)
  return module.servicesService
}

describe('ServicesService', () => {
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
})

