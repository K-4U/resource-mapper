import type { ServiceDefinition, GroupConnection } from '~/types'
import { detectCollision, findNearestValidPosition, type NodeBounds } from '~/utils/collisionDetection'

export type ConnectionDirection = 'vertical' | 'horizontal'
export type NodeSide = 'top' | 'bottom' | 'left' | 'right'

export interface PositionConfig {
  connectionDirection: ConnectionDirection
  sourceSide: NodeSide
  targetSide: NodeSide
  nodeWidth: number
  nodeHeight: number
  horizontalSpacing: number
  verticalSpacing: number
  groupPadding: number
  nodeMargin: number // Minimum space between service nodes
  cols?: number
}

export interface ServiceNodeInfo {
  id: string
  service: ServiceDefinition
  index: number
  outgoingConnections: string[]
  incomingConnections: string[]
}

export class NodePositionCalculator {
  private readonly config: Required<PositionConfig>
  private readonly positions: Map<string, { x: number; y: number }> = new Map()
  private readonly nodeInfoMap: Map<string, ServiceNodeInfo> = new Map()

  constructor(config: Partial<PositionConfig> = {}) {
    this.config = {
      connectionDirection: config.connectionDirection ?? 'vertical',
      sourceSide: config.sourceSide ?? 'bottom',
      targetSide: config.targetSide ?? 'top',
      nodeWidth: config.nodeWidth ?? 140,
      nodeHeight: config.nodeHeight ?? 80,
      horizontalSpacing: config.horizontalSpacing ?? 40,
      verticalSpacing: config.verticalSpacing ?? 30,
      groupPadding: config.groupPadding ?? 20,
      nodeMargin: config.nodeMargin ?? 10,
      cols: config.cols ?? 3
    }
  }

  /**
   * Register all services in the group before calculating positions
   */
  public registerServices(services: ServiceDefinition[]): void {
    this.nodeInfoMap.clear()

    services.forEach((service, index) => {
      const serviceId = `${service.groupName}/${service.identifier}`

      const outgoing = service.outgoingConnections?.map(conn => conn.targetIdentifier) ?? []
      
      // Use the actual incoming connections from the service definition, but filter to only internal ones
      const incoming = service.incomingConnections?.map(conn => conn.targetIdentifier) ?? []
      
      this.nodeInfoMap.set(serviceId, {
        id: serviceId,
        service,
        index,
        outgoingConnections: outgoing,
        incomingConnections: incoming // Will be filtered later in calculateLayer
      })
    })
  }

  /**
   * Calculate position for a service based on its connections and dependencies
   */
  public calculatePosition(serviceId: string): { x: number; y: number } {
    // Check if already calculated
    if (this.positions.has(serviceId)) {
      return this.positions.get(serviceId)!
    }

    const nodeInfo = this.nodeInfoMap.get(serviceId)
    if (!nodeInfo) {
      // Fallback for unknown nodes
      return this.getFallbackPosition(serviceId)
    }

    const position = this.config.connectionDirection === 'vertical'
      ? this.calculateVerticalPosition(nodeInfo)
      : this.calculateHorizontalPosition(nodeInfo)

    // Ensure no overlap with existing nodes
    const adjustedPosition = this.ensureNoOverlap(position, serviceId)
    this.positions.set(serviceId, adjustedPosition)

    return adjustedPosition
  }

  /**
   * Calculate position using vertical layout (top->bottom connections)
   */
  private calculateVerticalPosition(nodeInfo: ServiceNodeInfo): { x: number; y: number } {
    // Determine layer (vertical position) based on dependencies
    const layer = this.calculateLayer(nodeInfo)

    // Determine column (horizontal position) based on connections
    const column = this.calculateColumn(nodeInfo, layer)

    const x = this.config.groupPadding + column * (this.config.nodeWidth + this.config.horizontalSpacing)
    const y = this.config.groupPadding + 20 + layer * (this.config.nodeHeight + this.config.verticalSpacing)

    return { x, y }
  }

  /**
   * Calculate position using horizontal layout (left->right connections)
   */
  private calculateHorizontalPosition(nodeInfo: ServiceNodeInfo): { x: number; y: number } {
    const layer = this.calculateLayer(nodeInfo)
    const row = this.calculateColumn(nodeInfo, layer)

    const x = this.config.groupPadding + layer * (this.config.nodeWidth + this.config.horizontalSpacing)
    const y = this.config.groupPadding + 20 + row * (this.config.nodeHeight + this.config.verticalSpacing)

    return { x, y }
  }

  /**
   * Calculate the layer/depth of a node based on its dependencies
   * Nodes with no incoming connections are layer 0
   * Nodes are placed at max(parent layers) + 1
   */
  private calculateLayer(nodeInfo: ServiceNodeInfo): number {
    const { incomingConnections } = nodeInfo

    // Filter to only internal connections (same group)
    const internalIncoming = incomingConnections.filter(id =>
      this.nodeInfoMap.has(id)
    )

    if (internalIncoming.length === 0) {
      return 0 // Root node
    }

    // Calculate based on parent layers
    let maxParentLayer = -1
    for (const parentId of internalIncoming) {
      const parentNode = this.nodeInfoMap.get(parentId)
      if (parentNode) {
        const parentLayer = this.calculateLayer(parentNode)
        maxParentLayer = Math.max(maxParentLayer, parentLayer)
      }
    }

    return maxParentLayer + 1
  }

  /**
   * Calculate column position to minimize edge crossings
   */
  private calculateColumn(nodeInfo: ServiceNodeInfo, _layer: number): number {
    const { outgoingConnections, incomingConnections, index } = nodeInfo

    // Filter internal connections
    const internalIncoming = incomingConnections.filter(id => this.nodeInfoMap.has(id))
    const internalOutgoing = outgoingConnections.filter(id => this.nodeInfoMap.has(id))

    if (internalIncoming.length === 0 && internalOutgoing.length === 0) {
      // No connections, use simple grid
      return index % this.config.cols
    }

    // Calculate average column of connected nodes
    const connectedColumns: number[] = []

    for (const connId of [...internalIncoming, ...internalOutgoing]) {
      const pos = this.positions.get(connId)
      if (pos) {
        const col = Math.round((pos.x - this.config.groupPadding) / (this.config.nodeWidth + this.config.horizontalSpacing))
        connectedColumns.push(col)
      }
    }

    if (connectedColumns.length > 0) {
      // Place near average position of connected nodes
      const avgCol = Math.round(
        connectedColumns.reduce((a, b) => a + b, 0) / connectedColumns.length
      )
      return Math.max(0, avgCol)
    }

    // Default to grid position
    return index % this.config.cols
  }

  /**
   * Ensure the position doesn't overlap with existing nodes
   */
  private ensureNoOverlap(position: { x: number; y: number }, currentId: string): { x: number; y: number } {
    // Get existing nodes as bounds (excluding current node)
    const existingNodes: NodeBounds[] = []
    for (const [id, pos] of this.positions.entries()) {
      if (id !== currentId) {
        existingNodes.push({
          x: pos.x,
          y: pos.y,
          width: this.config.nodeWidth,
          height: this.config.nodeHeight
        })
      }
    }

    // Use the collision detection utility to find a valid position
    const validPosition = findNearestValidPosition(
      position,
      {
        width: this.config.nodeWidth,
        height: this.config.nodeHeight
      },
      existingNodes,
      { margin: this.config.nodeMargin },
      {
        maxAttempts: 50,
        stepX: this.config.nodeWidth + this.config.horizontalSpacing,
        stepY: this.config.nodeHeight + this.config.verticalSpacing,
        preferredDirection: this.config.connectionDirection === 'vertical' ? 'horizontal' : 'vertical'
      }
    )

    // Ensure minimum position
    validPosition.x = Math.max(this.config.groupPadding, validPosition.x)
    validPosition.y = Math.max(this.config.groupPadding + 20, validPosition.y)

    return validPosition
  }

  /**
   * Check if position overlaps with existing nodes
   */
  private findOverlap(position: { x: number; y: number }, currentId: string): boolean {
    const testNode: NodeBounds = {
      x: position.x,
      y: position.y,
      width: this.config.nodeWidth,
      height: this.config.nodeHeight
    }

    for (const [id, existingPos] of this.positions.entries()) {
      if (id === currentId) continue

      const existingNode: NodeBounds = {
        x: existingPos.x,
        y: existingPos.y,
        width: this.config.nodeWidth,
        height: this.config.nodeHeight
      }

      if (detectCollision(testNode, existingNode, { margin: this.config.nodeMargin })) {
        return true
      }
    }

    return false
  }

  /**
   * Fallback position for unknown nodes
   */
  private getFallbackPosition(_serviceId: string): { x: number; y: number } {
    const existingCount = this.positions.size
    const col = existingCount % this.config.cols
    const row = Math.floor(existingCount / this.config.cols)

    return {
      x: this.config.groupPadding + col * (this.config.nodeWidth + this.config.horizontalSpacing),
      y: this.config.groupPadding + 20 + row * (this.config.nodeHeight + this.config.verticalSpacing)
    }
  }

  /**
   * Reset calculator for a new group
   */
  public reset(): void {
    this.positions.clear()
    this.nodeInfoMap.clear()
  }

  /**
   * Get all calculated positions
   */
  public getAllPositions(): Map<string, { x: number; y: number }> {
    return new Map(this.positions)
  }

  /**
   * Get configuration
   */
  public getConfig(): Required<PositionConfig> {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PositionConfig>): void {
    Object.assign(this.config, config)
    // Clear positions when config changes
    this.positions.clear()
  }
}

/**
 * Group positioning calculator for overview mode
 * Positions groups based on their incoming/outgoing connections
 */
export class GroupPositionCalculator {
  private readonly positions: Map<string, { x: number; y: number }> = new Map()
  private readonly groupInfoMap: Map<string, GroupConnectionInfo> = new Map()

  constructor(
    private readonly groupWidth = 200,
    private readonly groupHeight = 150,
    private readonly horizontalSpacing = 100,
    private readonly verticalSpacing = 80,
    private readonly padding = 50
  ) {}

  /**
   * Register all groups and calculate their connection weights
   */
  public registerGroups(groupConnections: GroupConnection[]): void {
    this.groupInfoMap.clear()
    
    // First pass: create basic group info
    const allGroups = new Set<string>()
    groupConnections.forEach(group => {
      allGroups.add(group.groupName)
      if (group.connectedToGroups) {
        group.connectedToGroups.forEach(target => allGroups.add(target))
      }
    })

    // Initialize group info
    Array.from(allGroups).forEach(groupName => {
      this.groupInfoMap.set(groupName, {
        name: groupName,
        outgoingCount: 0,
        incomingCount: 0,
        outgoingTo: new Set(),
        incomingFrom: new Set(),
        serviceCount: 0
      })
    })

    // Second pass: calculate connection counts
    groupConnections.forEach(group => {
      const groupInfo = this.groupInfoMap.get(group.groupName)!
      groupInfo.serviceCount = group.serviceCount || 0
      
      if (group.connectedToGroups) {
        group.connectedToGroups.forEach(targetGroup => {
          if (this.groupInfoMap.has(targetGroup)) {
            // This group has outgoing connection
            groupInfo.outgoingTo.add(targetGroup)
            groupInfo.outgoingCount++
            
            // Target group has incoming connection
            const targetInfo = this.groupInfoMap.get(targetGroup)!
            targetInfo.incomingFrom.add(group.groupName)
            targetInfo.incomingCount++
          }
        })
      }
    })
  }

  /**
   * Calculate optimal positions for all groups
   */
  public calculateAllPositions(): Map<string, { x: number; y: number }> {
    this.positions.clear()
    
    // Sort groups by dependency order (least incoming first, most outgoing last)
    const sortedGroups = this.sortGroupsByDependencies()
    
    // Place groups in layers from left to right
    this.placeGroupsInLayers(sortedGroups)
    
    return new Map(this.positions)
  }

  /**
   * Sort groups by their connection patterns
   * Groups with fewer incoming connections come first (source-like)
   * Groups with more incoming connections come later (sink-like)
   */
  private sortGroupsByDependencies(): string[] {
    const groups = Array.from(this.groupInfoMap.keys())
    
    return groups.sort((a, b) => {
      const groupA = this.groupInfoMap.get(a)!
      const groupB = this.groupInfoMap.get(b)!
      
      // Primary sort: fewer incoming connections first (sources on left)
      if (groupA.incomingCount !== groupB.incomingCount) {
        return groupA.incomingCount - groupB.incomingCount
      }
      
      // Secondary sort: more outgoing connections first (within same incoming level)
      if (groupA.outgoingCount !== groupB.outgoingCount) {
        return groupB.outgoingCount - groupA.outgoingCount
      }
      
      // Tertiary sort: alphabetical for consistency
      return a.localeCompare(b)
    })
  }

  /**
   * Place groups in columns based on dependency level, stacked vertically within each column
   */
  private placeGroupsInLayers(sortedGroups: string[]): void {
    // Group by dependency score (incoming connection count)
    const groupsByLevel = new Map<number, string[]>()
    
    sortedGroups.forEach(groupName => {
      const groupInfo = this.groupInfoMap.get(groupName)!
      const level = groupInfo.incomingCount
      
      if (!groupsByLevel.has(level)) {
        groupsByLevel.set(level, [])
      }
      groupsByLevel.get(level)!.push(groupName)
    })
    
    // Sort levels and position groups
    const sortedLevels = Array.from(groupsByLevel.keys()).sort((a, b) => a - b)
    
    sortedLevels.forEach((level, columnIndex) => {
      const groupsInLevel = groupsByLevel.get(level)!
      const x = this.padding + columnIndex * (this.groupWidth + this.horizontalSpacing)
      
      // Stack groups vertically within this column
      groupsInLevel.forEach((groupName, rowIndex) => {
        const y = this.padding + rowIndex * (this.groupHeight + this.verticalSpacing)
        this.positions.set(groupName, { x, y })
      })
    })
  }



  /**
   * Reset the calculator
   */
  public reset(): void {
    this.positions.clear()
    this.groupInfoMap.clear()
  }
}

/**
 * Contextual group positioning for Group mode
 * Positions external groups to the left/right of the main group
 */
export class ContextualGroupPositioner {
  private readonly groupSpacing = 40
  private readonly groupHeight = 300
  private readonly groupWidth = 400

  constructor(
    private readonly mainGroupBounds: { x: number; y: number; width: number; height: number }
  ) {}

  public calculatePosition(
    groupName: string,
    side: 'left' | 'right' | 'top' | 'bottom',
    existingGroups: { id: string; position: { x: number; y: number } }[]
  ): { x: number; y: number } {
    const groupSpacing = this.groupSpacing
    const groupWidth = this.groupWidth
    const groupHeight = this.groupHeight
    const mainGroupBounds = this.mainGroupBounds

    let baseX: number
    let baseY: number

    if (side === 'left') {
      baseX = mainGroupBounds.x - groupWidth - groupSpacing * 2
      baseY = mainGroupBounds.y
    } else if (side === 'right') {
      baseX = mainGroupBounds.x + mainGroupBounds.width + groupSpacing * 2
      baseY = mainGroupBounds.y
    } else if (side === 'top') {
      baseX = mainGroupBounds.x + (mainGroupBounds.width - groupWidth) / 2
      baseY = mainGroupBounds.y - groupHeight - groupSpacing * 2
    } else { // bottom
      baseX = mainGroupBounds.x + (mainGroupBounds.width - groupWidth) / 2
      baseY = mainGroupBounds.y + mainGroupBounds.height + groupSpacing * 2
    }
    
    // Get existing groups on the same side/area to avoid overlap
    const existingGroupsOnSide = existingGroups
      .filter(g => {
        if (side === 'left') return g.position.x < mainGroupBounds.x && Math.abs(g.position.x - baseX) < groupWidth
        if (side === 'right') return g.position.x > mainGroupBounds.x && Math.abs(g.position.x - baseX) < groupWidth
        if (side === 'top') return g.position.y < mainGroupBounds.y && Math.abs(g.position.y - baseY) < groupHeight
        if (side === 'bottom') return g.position.y > mainGroupBounds.y && Math.abs(g.position.y - baseY) < groupHeight
        return false
      })
      .sort((a, b) => {
        if (side === 'left' || side === 'right') return a.position.y - b.position.y
        return a.position.x - b.position.x
      })
    
    let xPosition = baseX
    let yPosition = baseY
    
    let attempts = 0
    const maxAttempts = 20
    
    while (attempts < maxAttempts) {
      let hasCollision = false
      
      for (const existingGroup of existingGroupsOnSide) {
        const existingBounds = {
          x: existingGroup.position.x,
          y: existingGroup.position.y,
          width: groupWidth,
          height: groupHeight
        }
        
        // Check for overlap
        const collision = !(
          xPosition + groupWidth + groupSpacing <= existingBounds.x ||
          xPosition >= existingBounds.x + existingBounds.width + groupSpacing ||
          yPosition + groupHeight + groupSpacing <= existingBounds.y ||
          yPosition >= existingBounds.y + existingBounds.height + groupSpacing
        )
        
        if (collision) {
          hasCollision = true
          if (side === 'left' || side === 'right') {
            yPosition = existingBounds.y + existingBounds.height + groupSpacing
          } else {
            xPosition = existingBounds.x + existingBounds.width + groupSpacing
          }
          break
        }
      }
      
      if (!hasCollision) break
      attempts++
    }

    return { x: xPosition, y: yPosition }
  }
}

interface GroupConnectionInfo {
  name: string
  outgoingCount: number
  incomingCount: number
  outgoingTo: Set<string>
  incomingFrom: Set<string>
  serviceCount: number
}

