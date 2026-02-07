import type {GroupInfo} from '~/types'

const sanitize = (value: string) => (value || 'group').replace(/[^a-zA-Z0-9_]/g, '_')

export interface GroupDiagramTranslation {
    diagram: string
    nodeToGroupMap: Record<string, string>
}

export function buildGroupOverviewDiagram(groups: Record<string, GroupInfo>): GroupDiagramTranslation {
    const nodeToGroupMap: Record<string, string> = {}
    if (!groups || Object.keys(groups).length === 0) {
        return {diagram: '', nodeToGroupMap}
    }
    const lines: string[] = ['graph TD']
    Object.keys(groups).forEach(groupId => {
        const nodeId = `group_${sanitize(groupId)}`
        nodeToGroupMap[nodeId] = groupId
        const label = groups[groupId].name ? groups[groupId].name : groupId
        lines.push(`  ${nodeId}["${label}"]`)
        lines.push('click ' + nodeId)
    })
    return {diagram: lines.join('\n'), nodeToGroupMap}
}
