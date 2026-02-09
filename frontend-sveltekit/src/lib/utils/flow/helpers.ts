import { ConnectionType } from '$lib/types'
import type { GroupConnection } from '$lib/types'

const sanitizeRegEx = /[^a-zA-Z0-9_]/g

export const sanitizeNodeId = (value: string, prefix = 'node') => {
  const safe = (value || prefix).replace(sanitizeRegEx, '_')
  return `${prefix}_${safe}`
}

export const formatConnectionLabel = (connectionCount: number) =>
  connectionCount === 1 ? '1 connection' : `${connectionCount} connections`

export const edgeColorForConnection = (connectionType?: ConnectionType) => {
  switch (connectionType) {
    case ConnectionType.PUBLISHES:
      return '#38bdf8'
    case ConnectionType.CALLS:
      return '#fbbf24'
    case ConnectionType.TRIGGERS:
      return '#c084fc'
    default:
      return '#60a5fa'
  }
}

export const createGraphSignature = (namespace: string, payload: unknown) =>
  `${namespace}:${JSON.stringify(payload)}`

export const mapConnectionsToSignaturePayload = (connections: GroupConnection[]) =>
  connections.map(({ sourceGroup, targetGroup, connectionCount }) => ({ sourceGroup, targetGroup, connectionCount }))
