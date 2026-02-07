import type {GroupInfo, ServiceDefinition} from '~/types'

const DEFAULT_INDENT = '  '
const sanitizeNodePart = (value: string) => (value || 'node').replace(/[^a-zA-Z0-9_]/g, '_')

export const escapeLabel = (value: string) => (value || '').replace(/"/g, '\\"')

export interface ServiceNodeOptions {
    indent?: string
    kind?: 'internal' | 'external'
}

export function buildServiceNodeLines(
    service: ServiceDefinition,
    options: ServiceNodeOptions = {}
): { nodeId: string; lines: string[] } {
    const indent = options.indent ?? DEFAULT_INDENT
    const nodeId = getServiceNodeIdFromDefinition(service)
    const label = escapeLabel(service.friendlyName)
    return {
        nodeId,
        lines: [`${indent}${nodeId}["${label}"]`, `${indent}click ${nodeId}`]
    }
}

export function getServiceNodeIdFromDefinition(service: ServiceDefinition): string {
    return sanitizeNodePart(`${service.groupName}_${service.identifier}`)
}

export interface GroupSubgraphOptions {
    indent?: string
    kind?: 'primary' | 'external'
    customId?: string
}

export function getGroupSubgraphId(group: Pick<GroupInfo, 'groupName'>, kind: GroupSubgraphOptions['kind'] = 'primary'): string {
    const prefix = kind === 'external' ? 'external' : 'group'
    return `${prefix}_${sanitizeNodePart(group.groupName)}`
}

export function buildGroupSubgraphLines(
    group: GroupInfo,
    bodyLines: string[],
    options: GroupSubgraphOptions = {}
): string[] {
    const indent = options.indent ?? DEFAULT_INDENT
    const kind = options.kind ?? 'primary'
    const groupId = options.customId ?? getGroupSubgraphId(group, kind)
    const safeLabel = escapeLabel(group.name)
    return [
        `${indent}subgraph ${groupId}["${safeLabel}"]`,
        ...bodyLines,
        `${indent}end`
    ]
}

export function buildConnectionLine(
  sourceNodeId: string,
  targetNodeId: string,
  label?: string,
  indent = DEFAULT_INDENT
): string {
  if (label) {
    return `${indent}${sourceNodeId} -->|${escapeLabel(label)}| ${targetNodeId}`
  }
  return `${indent}${sourceNodeId} --> ${targetNodeId}`
}
