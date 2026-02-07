import type { ExternalGroupServices, GroupInfo, ServiceDefinition } from '~/types'
import { buildConnectionLine, buildGroupSubgraphLines, buildServiceNodeLines, escapeLabel, getGroupSubgraphId } from '~/utils/mermaid/diagramHelpers'

const sanitize = (value: string) => (value || 'node').replace(/[^a-zA-Z0-9_]/g, '_')

export function buildGroupServicesDiagram(
  group: GroupInfo,
  services: ServiceDefinition[],
  externalGroups: ExternalGroupServices[] = []
): string {
  const lines: string[] = ['graph TD']
  const primaryGroupId = getGroupSubgraphId(group)
  const perServiceNodeIds = new Map<string, string>()
  const externalGroupLookup = new Map<string, ExternalGroupServices>()
  const externalSections = new Map<
    string,
    { group: GroupInfo; nodeLookup: Map<string, string>; lines: string[] }
  >()
  const groupBodyLines: string[] = []

  externalGroups.forEach(entry => {
    if (entry?.group?.groupName) {
      externalGroupLookup.set(entry.group.groupName, entry)
    }
  })

  if (!services.length) {
    groupBodyLines.push(`    placeholder_${primaryGroupId}["No services defined"]`)
    lines.push(...buildGroupSubgraphLines(group, groupBodyLines))
    return lines.join('\n')
  }

  services.forEach(service => {
    const { nodeId, lines: nodeLines } = buildServiceNodeLines(service, {
      indent: '    ',
      kind: 'internal'
    })
    perServiceNodeIds.set(service.identifier, nodeId)
    groupBodyLines.push(...nodeLines)
  })

  services.forEach(service => {
    const sourceNodeId = perServiceNodeIds.get(service.identifier)
    if (!sourceNodeId || !service.outgoingConnections) {
      return
    }

    service.outgoingConnections.forEach(connection => {
      const { groupId: targetGroupId, serviceId: targetServiceId } = connection.targetIdentifier
      if (!targetGroupId || targetGroupId !== group.groupName) {
        return
      }
      const targetNodeId = targetServiceId ? perServiceNodeIds.get(targetServiceId) : undefined
      if (!targetNodeId) {
        return
      }
      const edge = buildConnectionLine(sourceNodeId, targetNodeId, connection.connectionType, '    ')
      groupBodyLines.push(edge)
    })
  })

  lines.push(...buildGroupSubgraphLines(group, groupBodyLines))

  function ensureExternalSection(groupId: string): { group: GroupInfo; nodeLookup: Map<string, string>; lines: string[] } {
    let section = externalSections.get(groupId)
    if (section) {
      return section
    }
    const meta = externalGroupLookup.get(groupId)
    const groupInfo: GroupInfo = meta?.group ?? {
      name: groupId,
      groupName: groupId,
      description: undefined,
      teamId: undefined
    }
    section = { group: groupInfo, nodeLookup: new Map(), lines: [] }
    externalSections.set(groupId, section)
    return section
  }

  function ensureExternalNode(groupId: string, service: ServiceDefinition): string {
    const section = ensureExternalSection(groupId)
    const existing = section.nodeLookup.get(service.identifier)
    if (existing) {
      return existing
    }
    const { nodeId, lines } = buildServiceNodeLines(service, {
      indent: '    ',
      kind: 'external'
    })
    section.nodeLookup.set(service.identifier, nodeId)
    section.lines.push(...lines)
    return nodeId
  }

  services.forEach(service => {
    const sourceNodeId = perServiceNodeIds.get(service.identifier)
    if (!sourceNodeId || !service.outgoingConnections) {
      return
    }
    service.outgoingConnections.forEach(connection => {
      const target = connection.targetIdentifier
      if (!target?.groupId || !target.serviceId || target.groupId === group.groupName) {
        return
      }
      const externalGroup = externalGroupLookup.get(target.groupId)
      if (!externalGroup) {
        return
      }
      const targetService = externalGroup.services.find(s => s.identifier === target.serviceId)
      if (!targetService) {
        return
      }
      const targetNodeId = ensureExternalNode(target.groupId, targetService)
      const section = ensureExternalSection(target.groupId)
      section.lines.push(
        buildConnectionLine(sourceNodeId, targetNodeId, connection.connectionType, '    ')
      )
    })
  })

  externalSections.forEach(section => {
    lines.push(...buildGroupSubgraphLines(section.group, section.lines, { kind: 'external' }))
  })

  return lines.join('\n')
}
