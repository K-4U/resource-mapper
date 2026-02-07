import type { GroupInfo, ServiceDefinition } from '~/types'

const sanitize = (value: string) => (value || 'node').replace(/[^a-zA-Z0-9_]/g, '_')
const escapeLabel = (value: string) => (value || '').replace(/"/g, '\\"')

export const getServiceNodeId = (identifier: string) => sanitize(identifier)

export function buildGroupServicesDiagram(group: GroupInfo, services: ServiceDefinition[]): string {
  const lines: string[] = ['architecture-beta']
  const groupNodeId = `group_${sanitize(group.groupName)}`
  const groupLabel = escapeLabel(group.name)

  lines.push(`group ${groupNodeId}(cloud)[${groupLabel}]`)

  if (!services.length) {
    const emptyNode = `${groupNodeId}_empty`
    lines.push(`service ${emptyNode}(server)["No services defined"] in ${groupNodeId}`)
    return lines.join('\n')
  }

  services.forEach(service => {
    const nodeId = getServiceNodeId(service.identifier)
    const label = escapeLabel(service.friendlyName)
    lines.push(`service ${nodeId}(logos:aws-lambda)[${label}] in ${groupNodeId}`)
  })

  return lines.join('\n')
}
