import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

const { connectionsServiceMock, useAsyncDataMock } = vi.hoisted(() => ({
  connectionsServiceMock: {
    getConnectionsFromService: vi.fn(),
    getConnectionsToService: vi.fn(),
    getConnectionsFromGroup: vi.fn(),
    getConnectionsToGroup: vi.fn()
  },
  useAsyncDataMock: vi.fn()
}))

vi.mock('~/services/ConnectionsService', () => ({
  connectionsService: connectionsServiceMock
}))

vi.mock('#app', () => ({
  useAsyncData: (...args: unknown[]) => useAsyncDataMock(...args)
}))

import {
  useConnectionsFromService,
  useConnectionsToService,
  useConnectionsFromGroup,
  useConnectionsToGroup,
  useServiceConnections,
  useGroupConnectionsSummary
} from '~/composables/useConnections'

describe('useConnections composables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.values(connectionsServiceMock).forEach(fn => fn.mockReset())
    useAsyncDataMock.mockReset()
  })

  it('fetches outgoing connections for a service', async () => {
    const asyncResult = { data: [] }
    useAsyncDataMock.mockReturnValue(asyncResult)
    connectionsServiceMock.getConnectionsFromService.mockResolvedValue([{ startService: 'a/b' }])

    const serviceRef = ref('api/gateway')
    const result = useConnectionsFromService(serviceRef)

    expect(result).toBe(asyncResult)
    const [keyGetter, fetcher, options] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('connections-from-api/gateway')
    await fetcher()
    expect(connectionsServiceMock.getConnectionsFromService).toHaveBeenCalledWith('api/gateway')
    expect(options?.watch?.[0]?.()).toBe('api/gateway')
  })

  it('fetches incoming connections for a service', async () => {
    const asyncResult = { data: [] }
    useAsyncDataMock.mockReturnValue(asyncResult)
    connectionsServiceMock.getConnectionsToService.mockResolvedValue([{ targetService: 'api/gateway' }])

    const serviceRef = ref('api/gateway')
    useConnectionsToService(serviceRef)
    const [keyGetter] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('connections-to-api/gateway')
  })

  it('fetches outgoing connections for a group', async () => {
    const asyncResult = { data: [] }
    useAsyncDataMock.mockReturnValue(asyncResult)
    connectionsServiceMock.getConnectionsFromGroup.mockResolvedValue([{ startService: 'api/gateway' }])

    const groupRef = ref('api')
    useConnectionsFromGroup(groupRef)
    const [keyGetter] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('group-connections-from-api')
  })

  it('fetches incoming connections for a group and handles empty identifiers', async () => {
    const asyncResult = { data: [] }
    useAsyncDataMock.mockReturnValue(asyncResult)

    useConnectionsToGroup(ref(null))
    const [, fetcher] = useAsyncDataMock.mock.calls[0]
    const value = await fetcher()
    expect(value).toEqual([])
    expect(connectionsServiceMock.getConnectionsToGroup).not.toHaveBeenCalled()
  })

  it('fetches both directions for a service via combined helper', async () => {
    const asyncResult = { data: { from: [], to: [] } }
    useAsyncDataMock.mockReturnValue(asyncResult)
    connectionsServiceMock.getConnectionsFromService.mockResolvedValue([
      { startService: 'api/gateway', targetService: 'data/warehouse' }
    ])
    connectionsServiceMock.getConnectionsToService.mockResolvedValue([
      { startService: 'frontend/site', targetService: 'api/gateway' }
    ])

    const serviceRef = ref('api/gateway')
    const result = useServiceConnections(serviceRef)

    expect(result).toBe(asyncResult)
    const [keyGetter, fetcher, options] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('service-connections-api/gateway')
    const value = await fetcher()
    expect(value.from).toHaveLength(1)
    expect(value.to).toHaveLength(1)
    expect(options?.watch?.[0]?.()).toBe('api/gateway')
    expect(connectionsServiceMock.getConnectionsFromService).toHaveBeenCalledWith('api/gateway')
    expect(connectionsServiceMock.getConnectionsToService).toHaveBeenCalledWith('api/gateway')
  })

  it('fetches both directions for a group via combined helper', async () => {
    const asyncResult = { data: { from: [], to: [] } }
    useAsyncDataMock.mockReturnValue(asyncResult)
    connectionsServiceMock.getConnectionsFromGroup.mockResolvedValue([
      { startService: 'api/gateway', targetService: 'frontend/site' }
    ])
    connectionsServiceMock.getConnectionsToGroup.mockResolvedValue([
      { startService: 'data/warehouse', targetService: 'api/gateway' }
    ])

    const groupRef = ref('api')
    useGroupConnectionsSummary(groupRef)
    const [keyGetter, fetcher] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('group-connections-summary-api')
    const value = await fetcher()
    expect(value.from).toHaveLength(1)
    expect(value.to).toHaveLength(1)
  })
})
