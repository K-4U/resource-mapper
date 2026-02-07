import { unref, type MaybeRef } from 'vue'
import { useAsyncData } from '#app'
import { connectionsService } from '~/services/ConnectionsService'
import type { ServiceConnection } from '~/types'

function ensureArrayResult<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

export function useConnectionsFromService(serviceId: MaybeRef<string | null | undefined>) {
  return useAsyncData<ServiceConnection[]>(
    () => {
      const id = unref(serviceId)
      return id ? `connections-from-${id}` : 'connections-from-null'
    },
    () => {
      const id = unref(serviceId)
      if (!id) {
        return Promise.resolve<ServiceConnection[]>([])
      }
      return connectionsService.getConnectionsFromService(id).then(ensureArrayResult)
    },
    {
      watch: [() => unref(serviceId)]
    }
  )
}

export function useConnectionsToService(serviceId: MaybeRef<string | null | undefined>) {
  return useAsyncData<ServiceConnection[]>(
    () => {
      const id = unref(serviceId)
      return id ? `connections-to-${id}` : 'connections-to-null'
    },
    () => {
      const id = unref(serviceId)
      if (!id) {
        return Promise.resolve<ServiceConnection[]>([])
      }
      return connectionsService.getConnectionsToService(id).then(ensureArrayResult)
    },
    {
      watch: [() => unref(serviceId)]
    }
  )
}

export function useConnectionsFromGroup(groupId: MaybeRef<string | null | undefined>) {
  return useAsyncData<ServiceConnection[]>(
    () => {
      const id = unref(groupId)
      return id ? `group-connections-from-${id}` : 'group-connections-from-null'
    },
    () => {
      const id = unref(groupId)
      if (!id) {
        return Promise.resolve<ServiceConnection[]>([])
      }
      return connectionsService.getConnectionsFromGroup(id).then(ensureArrayResult)
    },
    {
      watch: [() => unref(groupId)]
    }
  )
}

export function useConnectionsToGroup(groupId: MaybeRef<string | null | undefined>) {
  return useAsyncData<ServiceConnection[]>(
    () => {
      const id = unref(groupId)
      return id ? `group-connections-to-${id}` : 'group-connections-to-null'
    },
    () => {
      const id = unref(groupId)
      if (!id) {
        return Promise.resolve<ServiceConnection[]>([])
      }
      return connectionsService.getConnectionsToGroup(id).then(ensureArrayResult)
    },
    {
      watch: [() => unref(groupId)]
    }
  )
}

export function useServiceConnections(serviceId: MaybeRef<string | null | undefined>) {
  return useAsyncData<{ from: ServiceConnection[]; to: ServiceConnection[] }>(
    () => {
      const id = unref(serviceId)
      return id ? `service-connections-${id}` : 'service-connections-null'
    },
    async () => {
      const id = unref(serviceId)
      if (!id) {
        return { from: [], to: [] }
      }
      const [from, to] = await Promise.all([
        connectionsService.getConnectionsFromService(id),
        connectionsService.getConnectionsToService(id)
      ])
      return {
        from: ensureArrayResult(from),
        to: ensureArrayResult(to)
      }
    },
    {
      watch: [() => unref(serviceId)]
    }
  )
}

export function useGroupConnectionsSummary(groupId: MaybeRef<string | null | undefined>) {
  return useAsyncData<{ from: ServiceConnection[]; to: ServiceConnection[] }>(
    () => {
      const id = unref(groupId)
      return id ? `group-connections-summary-${id}` : 'group-connections-summary-null'
    },
    async () => {
      const id = unref(groupId)
      if (!id) {
        return { from: [], to: [] }
      }
      const [from, to] = await Promise.all([
        connectionsService.getConnectionsFromGroup(id),
        connectionsService.getConnectionsToGroup(id)
      ])
      return {
        from: ensureArrayResult(from),
        to: ensureArrayResult(to)
      }
    },
    {
      watch: [() => unref(groupId)]
    }
  )
}
