import type { GroupInfo } from '~/types'
import type { GroupConnection } from '~/types'

const sanitize = (value: string) => (value || 'group').replace(/[^a-zA-Z0-9_]/g, '_')

export interface GroupDiagramTranslation {
    diagram: string
    nodeToGroupMap: Record<string, string>
}

export function buildGroupOverviewDiagram(
  groups: Record<string, GroupInfo>,
  connections: GroupConnection[] = []
): GroupDiagramTranslation {
    const nodeToGroupMap: Record<string, string> = {}
    if (!groups || Object.keys(groups).length === 0) {
        return {diagram: '', nodeToGroupMap}
    }
    const lines: string[] = ['graph TD']
    const ensureNode = (groupId: string) => {
        const nodeId = `group_${sanitize(groupId)}`
        if (!nodeToGroupMap[nodeId]) {
            nodeToGroupMap[nodeId] = groupId
            const label = groups[groupId]?.name ? groups[groupId].name : groupId
            lines.push(`  ${nodeId}["${label}"]`, 'click ' + nodeId)
        }
        return nodeId
    }
    Object.keys(groups).forEach(groupId => ensureNode(groupId))
    connections.forEach(({ sourceGroup, targetGroup, connectionCount }) => {
        const sourceNode = ensureNode(sourceGroup)
        const targetNode = ensureNode(targetGroup)
        lines.push(`  ${sourceNode} -->|${connectionCount}| ${targetNode}`)
    })
    return {diagram: lines.join('\n'), nodeToGroupMap}
}
