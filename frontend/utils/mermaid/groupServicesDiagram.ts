import type { ExternalConnectionDirection, ExternalGroupServices, GroupInfo, ServiceDefinition } from '~/types'
import { buildConnectionLine, buildGroupSubgraphLines, buildServiceNodeLines, getGroupSubgraphId } from '~/utils/mermaid/diagramHelpers'

const sanitize = (value: string) => (value || 'node').replace(/[^a-zA-Z0-9_]/g, '_')

export function buildGroupServicesDiagram(
  group: GroupInfo,
  services: ServiceDefinition[],
  externalGroups: ExternalGroupServices[] = []
): string {
  const lines: string[] = ['graph TD']
  const perServiceNodeIds = new Map<string, string>()
  const groupBodyLines: string[] = []
  const externalLookups = splitExternalGroups(externalGroups)
  const externalSections = new Map<string, ExternalSection>()

  if (!services.length) {
    groupBodyLines.push(`    placeholder_${getGroupSubgraphId(group)}["No services defined"]`)
    lines.push(...buildGroupSubgraphLines(group, groupBodyLines))
    return lines.join('\n')
  }

  addInternalServiceNodes(services, perServiceNodeIds, groupBodyLines)
  linkInternalConnections(group, services, perServiceNodeIds, groupBodyLines)
  lines.push(...buildGroupSubgraphLines(group, groupBodyLines))

  linkOutgoingExternalConnections(services, perServiceNodeIds, externalLookups.outgoing, externalSections)
  linkIncomingExternalConnections(services, perServiceNodeIds, externalLookups.incoming, externalSections)
  attachExternalSections(externalSections, lines)

  return lines.join('\n')
}

interface ExternalSection {
  group: GroupInfo
  direction: ExternalConnectionDirection
  nodeLookup: Map<string, string>
  lines: string[]
}

interface ExternalLookups {
  incoming: Map<string, ExternalGroupServices>
  outgoing: Map<string, ExternalGroupServices>
}

// Groups external connection metadata by direction for quick lookup later.
function splitExternalGroups(externalGroups: ExternalGroupServices[]): ExternalLookups {
  const incoming = new Map<string, ExternalGroupServices>()
  const outgoing = new Map<string, ExternalGroupServices>()
  externalGroups.forEach(entry => {
    if (!entry?.group?.groupName) {
      return
    }
    if (entry.direction === 'incoming') {
      incoming.set(entry.group.groupName, entry)
    } else {
      outgoing.set(entry.group.groupName, entry)
    }
  })
  return { incoming, outgoing }
}

// Adds Mermaid nodes for every service in the current group.
function addInternalServiceNodes(
  services: ServiceDefinition[],
  perServiceNodeIds: Map<string, string>,
  groupBodyLines: string[]
) {
  services.forEach(service => {
    const { nodeId, lines } = buildServiceNodeLines(service, { indent: '    ', kind: 'internal' })
    perServiceNodeIds.set(service.identifier, nodeId)
    groupBodyLines.push(...lines)
  })
}

// Draws edges between services inside the same group.
function linkInternalConnections(
  group: GroupInfo,
  services: ServiceDefinition[],
  perServiceNodeIds: Map<string, string>,
  groupBodyLines: string[]
) {
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
      groupBodyLines.push(buildConnectionLine(sourceNodeId, targetNodeId, connection.connectionType, '    '))
    })
  })
}

// Renders nodes/edges for services that the current group calls.
function linkOutgoingExternalConnections(
  services: ServiceDefinition[],
  perServiceNodeIds: Map<string, string>,
  outgoingLookup: Map<string, ExternalGroupServices>,
  externalSections: Map<string, ExternalSection>
) {
  services.forEach(service => {
    const sourceNodeId = perServiceNodeIds.get(service.identifier)
    if (!sourceNodeId || !service.outgoingConnections) {
      return
    }
    service.outgoingConnections.forEach(connection => {
      const target = connection.targetIdentifier
      if (!target?.groupId || !target.serviceId || target.groupId === service.groupName) {
        return
      }
      const externalGroup = outgoingLookup.get(target.groupId)
      if (!externalGroup) {
        return
      }
      const targetService = externalGroup.services.find(s => s.identifier === target.serviceId)
      if (!targetService) {
        return
      }
      const targetNodeId = ensureExternalNode(target.groupId, targetService, 'outgoing', outgoingLookup, externalSections)
      const sectionKey = makeSectionKey(target.groupId, 'outgoing')
      externalSections.get(sectionKey)!.lines.push(
        buildConnectionLine(sourceNodeId, targetNodeId, connection.connectionType, '    ')
      )
    })
  })
}

// Renders nodes/edges for services that call into the current group.
function linkIncomingExternalConnections(
  services: ServiceDefinition[],
  perServiceNodeIds: Map<string, string>,
  incomingLookup: Map<string, ExternalGroupServices>,
  externalSections: Map<string, ExternalSection>
) {
  services.forEach(service => {
    const targetNodeId = perServiceNodeIds.get(service.identifier)
    if (!targetNodeId || !service.incomingConnections) {
      return
    }
    service.incomingConnections.forEach(connection => {
      const { groupId, serviceId } = connection.sourceIdentifier
      if (!groupId || !serviceId || groupId === service.groupName) {
        return
      }
      const incomingGroup = incomingLookup.get(groupId)
      if (!incomingGroup) {
        return
      }
      const sourceService = incomingGroup.services.find(s => s.identifier === serviceId)
      if (!sourceService) {
        return
      }
      const sourceNodeId = ensureExternalNode(groupId, sourceService, 'incoming', incomingLookup, externalSections)
      const sectionKey = makeSectionKey(groupId, 'incoming')
      externalSections.get(sectionKey)!.lines.push(
        buildConnectionLine(sourceNodeId, targetNodeId, connection.connectionType, '    ')
      )
    })
  })
}

// Appends all external subgraphs after internal rendering is done.
function attachExternalSections(externalSections: Map<string, ExternalSection>, lines: string[]) {
  externalSections.forEach(section => {
    lines.push(
      ...buildGroupSubgraphLines(section.group, section.lines, {
        kind: 'external',
        customId: `${section.direction}_${section.group.groupName}`
      })
    )
  })
}

function makeSectionKey(groupId: string, direction: ExternalConnectionDirection) {
  return `${direction}:${groupId}`
}

function ensureExternalNode(
  groupId: string,
  service: ServiceDefinition,
  direction: ExternalConnectionDirection,
  lookup: Map<string, ExternalGroupServices>,
  externalSections: Map<string, ExternalSection>
) {
  const key = makeSectionKey(groupId, direction)
  let section = externalSections.get(key)
  if (!section) {
    const meta = lookup.get(groupId)
    const groupInfo: GroupInfo = meta?.group ?? {
      name: groupId,
      groupName: groupId,
      description: undefined,
      teamId: undefined
    }
    section = { group: groupInfo, direction, nodeLookup: new Map(), lines: [] }
    externalSections.set(key, section)
  }
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
