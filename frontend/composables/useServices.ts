import { unref, type MaybeRef } from 'vue'
import { useAsyncData } from '#app'
import { servicesService } from '~/services/ServicesService'
import type { ServiceDefinition } from '~/types'

/**
 * Retrieves all services for the provided group identifier.
 */
export function useServices(groupId: MaybeRef<string | null | undefined>) {
  return useAsyncData<ServiceDefinition[]>(
    () => {
      const id = unref(groupId)
      return id ? `services-${id}` : 'services-null'
    },
    () => {
      const id = unref(groupId)
      if (!id) {
        return Promise.resolve([])
      }
      return servicesService.getServicesByGroup(id)
    },
    {
      watch: [() => unref(groupId)]
    }
  )
}

/**
 * Retrieves a single service definition based on group and service identifiers.
 */
export function useService(
  groupId: MaybeRef<string | null | undefined>,
  serviceId: MaybeRef<string | null | undefined>
) {
  return useAsyncData<ServiceDefinition | null>(
    () => {
      const gid = unref(groupId)
      const sid = unref(serviceId)
      return gid && sid ? `service-${gid}-${sid}` : 'service-null'
    },
    () => {
      const gid = unref(groupId)
      const sid = unref(serviceId)
      if (!gid || !sid) {
        return Promise.resolve(null)
      }
      return servicesService.getService(gid, sid)
    },
    {
      watch: [() => unref(groupId), () => unref(serviceId)]
    }
  )
}

