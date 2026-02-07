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
    const [keyGetter, fetcher] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('group-connections-from-api')
    await fetcher()
    expect(connectionsServiceMock.getConnectionsFromGroup).toHaveBeenCalledWith('api')
  })

  it('fetches incoming connections for a group', async () => {
    const asyncResult = { data: [] }
    useAsyncDataMock.mockReturnValue(asyncResult)
    connectionsServiceMock.getConnectionsToGroup.mockResolvedValue([{ targetService: 'api/billing' }])

    const groupRef = ref('api')
    useConnectionsToGroup(groupRef)
    const [keyGetter, fetcher] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('group-connections-to-api')
    await fetcher()
    expect(connectionsServiceMock.getConnectionsToGroup).toHaveBeenCalledWith('api')
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

   it('fetches group connections summary', async () => {
     const asyncResult = { data: [] }
     useAsyncDataMock.mockReturnValue(asyncResult)
     connectionsServiceMock.getConnectionsFromGroup.mockResolvedValue([{ startService: 'api/gateway' }])
     connectionsServiceMock.getConnectionsToGroup.mockResolvedValue([{ targetService: 'api/billing' }])

    const groupRef = ref('api')
    useGroupConnectionsSummary(groupRef)
    const [keyGetter, fetcher] = useAsyncDataMock.mock.calls[0]
    expect(keyGetter()).toBe('group-connections-summary-api')
    const value = await fetcher()
    expect(value.from).toHaveLength(1)
    expect(value.to).toHaveLength(1)
    expect(connectionsServiceMock.getConnectionsFromGroup).toHaveBeenCalledWith('api')
    expect(connectionsServiceMock.getConnectionsToGroup).toHaveBeenCalledWith('api')
  })
})
