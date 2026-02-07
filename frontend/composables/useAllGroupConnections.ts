import { useAsyncData } from '#app'
import { connectionsService } from '~/services/ConnectionsService'
import type { GroupConnection } from '~/types'

export function useAllGroupConnections(includeSelfConnections = false) {
  return useAsyncData<GroupConnection[]>(
    () => (includeSelfConnections ? 'group-connections-all' : 'group-connections'),
    () => connectionsService.getAllGroupConnections(includeSelfConnections),
    { server: false }
  )
}

