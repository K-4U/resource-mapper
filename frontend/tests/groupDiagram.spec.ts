import { describe, it, expect } from 'vitest'
import { buildGroupOverviewDiagram } from '~/utils/mermaid/groupDiagram'

describe('buildGroupOverviewDiagram', () => {
  it('renders all groups even when there are no connections', () => {
    const groups = {
      api: { name: 'API', groupName: 'api' },
      data: { name: 'Data', groupName: 'data' }
    }

    const { diagram, nodeToGroupMap } = buildGroupOverviewDiagram(groups, [])

    expect(diagram).toContain('group_api')
    expect(diagram).toContain('group_data')
    expect(Object.keys(nodeToGroupMap)).toHaveLength(2)
    expect(nodeToGroupMap['group_api']).toBe('api')
    expect(nodeToGroupMap['group_data']).toBe('data')
  })
})

