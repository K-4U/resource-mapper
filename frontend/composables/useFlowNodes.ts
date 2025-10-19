import type {Node} from '@vue-flow/core'
import type {ServiceDefinition} from '~/generated/api/src'

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
    public readonly data: { label: string; service: ServiceDefinition, isExternal: boolean }
    public readonly class: string

    constructor(
        private readonly service: ServiceDefinition,
        parentGroupId: string,
        positionX: number,
        positionY: number,
        private readonly isExternal: boolean = false
    ) {
        this.id = `${service.groupName}/${service.identifier}`
        this.type = 'service'
        this.position = {x: positionX, y: positionY}
        this.parentNode = parentGroupId
        this.data = {label: service.friendlyName, service: service, isExternal: isExternal}
        this.class = (isExternal ? 'external' : 'internal') + ' service-node';
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
            data: this.data,
            class: this.class
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
        this.position = {x: positionX, y: positionY}
        this.data = {label: displayName}
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
        external: boolean = false,
    ): ServiceNode {
        const {x, y} = this.calculateServicePosition(index)
        const serviceNode = new ServiceNode(service, this.id, x, y, external)
        this.services.push(serviceNode)
        return serviceNode
    }

    /**
     * Calculate position for a service within this group
     */
    private calculateServicePosition(index: number): { x: number; y: number } {
        // Base grid position
        const cols = this.isExternal ? 2 : 3
        const row = Math.floor(index / cols)
        const col = index % cols

        const baseX = this.isExternal ? 20 + col * 150 : 20 + col * 170
        const baseY = this.isExternal ? 50 + row * 110 : 60 + row * 120

        // Add deterministic jitter based on index to spread nodes
        // This prevents straight lines while keeping positions stable
        const jitterX = ((index * 73) % 50) - 25  // Range: -25 to +25
        const jitterY = ((index * 97) % 40) - 20  // Range: -20 to +20

        return {
            x: Math.max(10, baseX + jitterX),
            y: Math.max(40, baseY + jitterY)
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
