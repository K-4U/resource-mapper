import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

const { servicesServiceMock, useAsyncDataMock } = vi.hoisted(() => ({
  servicesServiceMock: {
    getServicesByGroup: vi.fn(),
    getService: vi.fn()
  },
  useAsyncDataMock: vi.fn()
}))

vi.mock('~/services/ServicesService', () => ({
  servicesService: servicesServiceMock
}))

vi.mock('#app', () => ({
  useAsyncData: (...args: unknown[]) => useAsyncDataMock(...args)
}))

import { useServices, useService } from '~/composables/useServices'

describe('useServices composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    servicesServiceMock.getServicesByGroup.mockReset()
    servicesServiceMock.getService.mockReset()
    useAsyncDataMock.mockReset()
  })

  it('fetches all services for a group via useAsyncData', async () => {
    const asyncResult = { data: [] }
    useAsyncDataMock.mockReturnValue(asyncResult)
    servicesServiceMock.getServicesByGroup.mockResolvedValue([])

    const groupRef = ref('api')
    const result = useServices(groupRef)

    expect(result).toBe(asyncResult)
    const [keyGetter, fetcher, options] = useAsyncDataMock.mock.calls[0]
    expect(typeof keyGetter).toBe('function')
    expect(typeof fetcher).toBe('function')
    expect(options?.watch).toBeDefined()
    expect(keyGetter()).toBe('services-api')

    await fetcher()
    expect(servicesServiceMock.getServicesByGroup).toHaveBeenCalledWith('api')

    groupRef.value = 'data'
    expect(keyGetter()).toBe('services-data')
  })

  it('builds keys and fetchers for individual services', async () => {
    const asyncResult = { data: null }
    useAsyncDataMock.mockReturnValue(asyncResult)
    const groupRef = ref('api')
    const serviceRef = ref('gateway')
    const serviceResponse = { identifier: 'gateway', groupName: 'api' }
    servicesServiceMock.getService.mockResolvedValue(serviceResponse)

    const result = useService(groupRef, serviceRef)

    expect(result).toBe(asyncResult)
    const [keyGetter, fetcher, options] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('service-api-gateway')

    await fetcher()
    expect(servicesServiceMock.getService).toHaveBeenCalledWith('api', 'gateway')

    expect(options?.watch?.length).toBe(2)
    const [watchGroup, watchService] = options!.watch!
    expect(watchGroup?.()).toBe('api')
    expect(watchService?.()).toBe('gateway')

    groupRef.value = 'data'
    serviceRef.value = 'warehouse'
    expect(keyGetter()).toBe('service-data-warehouse')
    expect(watchGroup?.()).toBe('data')
    expect(watchService?.()).toBe('warehouse')
  })

  it('short circuits when identifiers are missing', async () => {
    const asyncResult = { data: null }
    useAsyncDataMock.mockReturnValue(asyncResult)

    useService(ref(null), ref('svc'))
    const [, fetcherFirst] = useAsyncDataMock.mock.calls[0]
    const valueFirst = await fetcherFirst()
    expect(valueFirst).toBeNull()
    expect(servicesServiceMock.getService).not.toHaveBeenCalled()

    useAsyncDataMock.mockReset()
    servicesServiceMock.getService.mockReset()

    useService(ref('api'), ref(null))
    const [, fetcherSecond] = useAsyncDataMock.mock.calls[0]
    const valueSecond = await fetcherSecond()
    expect(valueSecond).toBeNull()
    expect(servicesServiceMock.getService).not.toHaveBeenCalled()
  })

  it('returns empty list when groupId is missing for useServices', async () => {
    const asyncResult = { data: [] }
    useAsyncDataMock.mockReturnValue(asyncResult)

    useServices(ref(null))
    const [, fetcher] = useAsyncDataMock.mock.calls[0]
    const value = await fetcher()
    expect(value).toEqual([])
    expect(servicesServiceMock.getServicesByGroup).not.toHaveBeenCalled()
  })
})
