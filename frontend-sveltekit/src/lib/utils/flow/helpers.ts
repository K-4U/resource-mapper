import type {GroupConnection} from '$lib/types'
import {type Edge, type InternalNode, type Node, Position} from "@xyflow/svelte";

const sanitizeRegEx = /[^a-zA-Z0-9_]/g

export const sanitizeNodeId = (value: string, prefix = 'node') => {
    const safe = (value || prefix).replace(sanitizeRegEx, '_')
    return `${prefix}::${safe}`
}

export const formatConnectionLabel = (connectionCount: number) =>
    connectionCount === 1 ? '1 connection' : `${connectionCount} connections`

export const createGraphSignature = (namespace: string, payload: unknown) =>
    `${namespace}:${JSON.stringify(payload)}`

export const mapConnectionsToSignaturePayload = (connections: GroupConnection[]) =>
    connections.map(({sourceGroup, targetGroup, connectionCount}) => ({sourceGroup, targetGroup, connectionCount}))

