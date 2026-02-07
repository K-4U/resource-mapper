import type { GroupInfo, ServiceDefinition } from '~/types'
import { getServiceCategory } from '~/utils/serviceTypeCategory'

const sanitize = (value: string) => (value || 'node').replace(/[^a-zA-Z0-9_]/g, '_')
const escapeLabel = (value: string) => (value || '').replace(/"/g, '\\"')

export const getServiceNodeId = (_groupName: string, identifier: string) => sanitize(identifier)

export function buildGroupServicesDiagram(group: GroupInfo, services: ServiceDefinition[]): string {
  const lines: string[] = ['graph TD']
  const groupNodeId = `group_${sanitize(group.groupName)}`
  const groupLabel = escapeLabel(group.name)
  const perServiceNodeIds = new Map<string, string>()

  lines.push(`  subgraph ${groupNodeId}["${groupLabel}"]`)

  if (!services.length) {
    lines.push(`    placeholder_${groupNodeId}["No services defined"]`)
    lines.push('  end')
    return lines.join('\n')
  }

  services.forEach(service => {
    const nodeId = getServiceNodeId(group.groupName, service.identifier)
    const label = escapeLabel(`${service.friendlyName}\\n(${getServiceCategory(service.serviceType)})`)
    perServiceNodeIds.set(service.identifier, nodeId)
    lines.push(`    ${nodeId}["${label}"]`)
    lines.push(`    click ${nodeId}`)
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
      const label = connection.connectionType || ''
      const edge = label
        ? `    ${sourceNodeId} -->|${escapeLabel(label)}| ${targetNodeId}`
        : `    ${sourceNodeId} --> ${targetNodeId}`
      lines.push(edge)
    })
  })

  lines.push('  end')

  return lines.join('\n')
}
