import {type Node} from '@vue-flow/core'
import type {ServiceDefinition} from '~/types'
import { NodePositionCalculator, type PositionConfig } from './useNodePositioning'

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
    public width: number = 140 // Default, will be updated from DOM
    public height: number = 80 // Default, will be updated from DOM

    constructor(
        private readonly service: ServiceDefinition,
        parentGroupId: string,
        positionX: number,
        positionY: number,
        private readonly isExternal: boolean = false,
        private readonly isIncomingOnly: boolean = false
    ) {
        this.id = `${service.groupName}/${service.identifier}`
        this.type = 'service'
        this.position = {x: positionX, y: positionY}
        this.parentNode = parentGroupId
        this.data = {label: service.friendlyName, service: service, isExternal: isExternal}
        
        const classes = ['service-node']
        if (isExternal) {
            classes.push('external', 'external-service')
            if (isIncomingOnly) {
                classes.push('incoming-only-service')
            }
        } else {
            classes.push('internal')
        }
        
        this.class = classes.join(' ')
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
    public readonly data: { label: string; groupName: string }
    public readonly label: string
    public readonly class: string

    private readonly services: ServiceNode[] = []
    private readonly positionCalculator: NodePositionCalculator

    public width: number = 400
    public height: number = 300

    constructor(
        private readonly groupName: string,
        displayName: string,
        positionX: number,
        positionY: number,
        private readonly isExternal: boolean = false,
        positionConfig?: Partial<PositionConfig>
    ) {
        this.id = `group-${groupName}`
        this.position = {x: positionX, y: positionY}
        this.data = {label: displayName, groupName: groupName}
        this.label = displayName
        this.class = (isExternal ? 'external' : 'internal') + ' group-parent'

        // Use proper node type for parent nodes
        this.type = isExternal ? 'external-group' : 'group'

        // Initialize position calculator with custom config
        const defaultConfig: Partial<PositionConfig> = {
            cols: isExternal ? 2 : 3,
            nodeWidth: 180,  // Increased from 140 to account for actual rendered width
            nodeHeight: 100, // Increased from 80 to account for actual rendered height + padding
            horizontalSpacing: 40,
            verticalSpacing: 30,
            nodeMargin: 20,  // Increased margin for better spacing
            groupPadding: 20,
            connectionDirection: 'vertical',
            sourceSide: 'bottom',
            targetSide: 'top'
        }

        this.positionCalculator = new NodePositionCalculator({
            ...defaultConfig,
            ...positionConfig
        })
    }

    /**
     * Register all services first (called before adding individual services)
     */
    public registerServices(services: ServiceDefinition[]): void {
        this.positionCalculator.registerServices(services)
    }

    /**
     * Add a service to this group
     */
    public addService(
        service: ServiceDefinition,
        index: number,
        external: boolean = false,
        incomingOnly: boolean = false
    ): ServiceNode {
        const serviceId = `${service.groupName}/${service.identifier}`
        const {x, y} = this.positionCalculator.calculatePosition(serviceId)
        const serviceNode = new ServiceNode(service, this.id, x, y, external, incomingOnly)
        this.services.push(serviceNode)
        return serviceNode
    }

    /**
     * Get all service nodes in this group
     */
    public getServices(): ServiceNode[] {
        return this.services
    }

    /**
     * Check if this external group should be hidden (all services are incoming-only)
     */
    public hasOnlyIncomingOnlyServices(): boolean {
        if (!this.isExternal || this.services.length === 0) {
            return false
        }
        
        return this.services.every(service => 
            service.class.includes('incoming-only-service')
        )
    }



    /**
     * Convert to Vue Flow Node format
     */
    public toNode(): Node {
        let nodeClass = this.class
        
        // Add empty-external-group class if this group has only incoming-only services
        if (this.hasOnlyIncomingOnlyServices()) {
            nodeClass += ' empty-external-group'
        }

        // Use default dimensions - actual dimensions will be calculated from DOM
        const defaultWidth = this.width
        const defaultHeight = this.height
        
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            data: this.data,
            label: this.label,
            class: nodeClass,
            style: {
                width: `${defaultWidth}px`,
                height: `${defaultHeight}px`
            }
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

    /**
     * Update position calculator configuration
     */
    public updatePositionConfig(config: Partial<PositionConfig>): void {
        this.positionCalculator.updateConfig(config)
    }


}
