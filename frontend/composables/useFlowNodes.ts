import type { Node } from '@vue-flow/core'
import type { ServiceDefinition } from '~/generated/api/src'

/**
 * Service node - represents a single service (internal or external)
 */
export class ServiceNode implements Partial<Node> {
  public readonly id: string
  public readonly type: 'service' | 'external-service'
  public readonly position: { x: number; y: number }
  public readonly parentNode: string
  public readonly extent = 'parent' as const
  public readonly expandParent = true
  public readonly data: { label: string }

  constructor(
    private readonly service: ServiceDefinition,
    parentGroupId: string,
    positionX: number,
    positionY: number,
    nodeType: 'service' | 'external-service' = 'service'
  ) {
    this.id = `${service.groupName}/${service.identifier}`
    this.type = nodeType
    this.position = { x: positionX, y: positionY }
    this.parentNode = parentGroupId
    this.data = { label: service.friendlyName }
  }

  /**
   * Convert to Vue Flow Node format
   */
  public toNode(): Node {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      parentNode: this.parentNode,
      extent: this.extent,
      expandParent: this.expandParent,
      data: this.data
    }
  }
}

/**
 * Group node - represents a container for services
 */
export class GroupNode implements Partial<Node> {
  public readonly id: string
  public readonly type: string
  public readonly position: { x: number; y: number }
  public readonly data: { label: string }
  public readonly label: string
  public readonly style: Record<string, any>
  public readonly class: string

  private readonly services: ServiceNode[] = []

  constructor(
    private readonly groupName: string,
    displayName: string,
    positionX: number,
    positionY: number,
    private readonly isExternal: boolean = false
  ) {
    this.id = `group-${groupName}`
    this.position = { x: positionX, y: positionY }
    this.data = { label: displayName }
    this.label = displayName
    this.class = (isExternal ? 'external' : 'internal') + ' group-parent';

    // Use proper node type for parent nodes
    this.type = isExternal ? 'external-group' : 'group'
  }

  /**
   * Add a service to this group
   */
  public addService(
    service: ServiceDefinition,
    index: number,
    nodeType: 'service' | 'external-service' = 'service'
  ): ServiceNode {
    const { x, y } = this.calculateServicePosition(index)
    const serviceNode = new ServiceNode(service, this.id, x, y, nodeType)
    this.services.push(serviceNode)
    return serviceNode
  }

  /**
   * Calculate position for a service within this group
   */
  private calculateServicePosition(index: number): { x: number; y: number } {
    if (this.isExternal) {
      // External groups: 2 columns
      const row = Math.floor(index / 2)
      const col = index % 2
      return {
        x: 20 + col * 140,
        y: 50 + row * 80
      }
    } else {
      // Internal groups: 3 columns
      const row = Math.floor(index / 3)
      const col = index % 3
      return {
        x: 20 + col * 150,
        y: 60 + row * 100
      }
    }
  }

  /**
   * Get all service nodes in this group
   */
  public getServices(): ServiceNode[] {
    return this.services
  }

  /**
   * Convert to Vue Flow Node format
   */
  public toNode(): Node {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      data: this.data,
      label: this.label,
      style: this.style,
      class: this.class
    }
  }

  /**
   * Get all Vue Flow nodes (group + services)
   */
  public getAllNodes(): Node[] {
    const groupNode = this.toNode()
    const serviceNodes = this.services.map(s => s.toNode())

    // Return parent and children without manual z-index
    // Vue Flow handles this automatically with proper parent-child setup
    return [
      groupNode,
      ...serviceNodes
    ]
  }
}
