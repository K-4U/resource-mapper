import type { ServiceDefinition } from '~/types'

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
    const buffer = 10 // Extra spacing buffer
    let adjustedPos = { ...position }
    let attempts = 0
    const maxAttempts = 50

    while (attempts < maxAttempts) {
      const overlap = this.findOverlap(adjustedPos, currentId, buffer)

      if (!overlap) {
        break
      }

      // For horizontal layout, prefer moving down (vertical stacking) over moving right (different layers)
      if (this.config.connectionDirection === 'horizontal') {
        // Move down first for horizontal layout (services in same layer stack vertically)
        adjustedPos.y += this.config.nodeHeight + this.config.verticalSpacing
      } else {
        // For vertical layout, move right first  
        if (attempts % 2 === 0) {
          adjustedPos.x += this.config.nodeWidth + this.config.horizontalSpacing
        } else {
          adjustedPos.y += this.config.nodeHeight + this.config.verticalSpacing
        }
      }

      attempts++
    }

    // Ensure minimum position
    adjustedPos.x = Math.max(this.config.groupPadding, adjustedPos.x)
    adjustedPos.y = Math.max(this.config.groupPadding + 20, adjustedPos.y)

    return adjustedPos
  }

  /**
   * Check if position overlaps with existing nodes
   */
  private findOverlap(position: { x: number; y: number }, currentId: string, buffer: number): boolean {
    for (const [id, existingPos] of this.positions.entries()) {
      if (id === currentId) continue

      const xOverlap = Math.abs(position.x - existingPos.x) < (this.config.nodeWidth + buffer)
      const yOverlap = Math.abs(position.y - existingPos.y) < (this.config.nodeHeight + buffer)

      if (xOverlap && yOverlap) {
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

