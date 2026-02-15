import ELK, { type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { Edge, Node } from '@xyflow/svelte';
import type { FlowEdgeData, FlowGraphInput, FlowGraphOutput, FlowNodeData } from '$lib/utils/flow/types';
import type { ElkNode, ElkPoint } from "elkjs/lib/elk-api";

const elk = new ELK();
const PADDING = 10;

const ELK_OPTIONS: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.spacing.nodeNode': '80',
    // Routing specific
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.portConstraints': 'FREE',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
};

/**
 * Maps Svelte Flow edges to ELK edges.
 * Note: ELK expects sources/targets as arrays of strings.
 */
function convertEdgesToElkEdges(input: FlowGraphInput) {
    return input.edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
        originalEdge: edge
    }));
}

export async function layoutFlowGraph(input: FlowGraphInput): Promise<FlowGraphOutput> {
    const elkEdges = convertEdgesToElkEdges(input);

    // 1. Build the nested ELK structure
    // We map parents and nest their respective children inside them
    const elkChildren: ElkNode[] = input.groupNodes.map(parent => ({
        ...parent,
        layoutOptions: {
            ...ELK_OPTIONS,
            'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            'elk.padding': `[top=60,left=${PADDING},bottom=${PADDING},right=${PADDING}]`
        },
        children: input.serviceNodes.filter(child => child.parentId === parent.id)
    }));

    // Add orphan service nodes (no parent) to the root level
    input.serviceNodes
        .filter(child => child.parentId === undefined)
        .forEach(node => elkChildren.push(node));

    const elkGraph = {
        id: 'root',
        layoutOptions: ELK_OPTIONS,
        children: elkChildren,
        edges: elkEdges
    };

    return elk.layout(elkGraph).then((layoutedGraph) => {
        const flattenedNodes: Node<FlowNodeData>[] = [];
        const allLayoutedEdges: (ElkExtendedEdge & { containerId?: string, originalEdge: Edge<FlowEdgeData> })[] = [];
        const parentPositions = new Map<string, { x: number, y: number }>();

        // 2. Process Nodes & Collect Parent Positions
        // We also "tag" edges found inside parents so we know they need an offset
        layoutedGraph.children?.forEach(parent => {
            const parentX = parent.x || 0;
            const parentY = parent.y || 0;
            parentPositions.set(parent.id, { x: parentX, y: parentY });

            // Add Parent Node
            flattenedNodes.push({
                ...parent,
                position: { x: parentX, y: parentY },
                draggable: true,
            } as Node<FlowNodeData>);

            // Collect internal edges belonging to this parent
            if (parent.edges) {
                parent.edges.forEach((e: any) => {
                    allLayoutedEdges.push({ ...e, containerId: parent.id });
                });
            }

            // Add Child Nodes
            parent.children?.forEach(child => {
                flattenedNodes.push({
                    ...child,
                    position: { x: child.x || 0, y: child.y || 0 },
                    draggable: true,
                    // Use the extent buffer we discussed
                    extent: [[PADDING, 50], [(parent.width || 0) - PADDING, (parent.height || 0) - PADDING]]
                } as Node<FlowNodeData>);
            });
        });

        // Collect Root-level edges (usually cross-parent connections)
        if (layoutedGraph.edges) {
            layoutedGraph.edges.forEach((e: any) => {
                allLayoutedEdges.push({ ...e, containerId: 'root' });
            });
        }

        // 3. Process Edges with Coordinate Translation
        const finalEdges: Edge<FlowEdgeData>[] = allLayoutedEdges.map((edge) => {
            const section = edge.sections?.[0];
            const points: ElkPoint[] = [];

            if (section) {
                // If the edge is inside a parent, it is relative to that parent.
                // We must add the parent's X/Y to make it global for Svelte Flow.
                const offset = edge.containerId && edge.containerId !== 'root'
                    ? parentPositions.get(edge.containerId)
                    : { x: 0, y: 0 };

                const translate = (p: ElkPoint) => ({
                    x: p.x + (offset?.x || 0),
                    y: p.y + (offset?.y || 0)
                });

                points.push(translate(section.startPoint));
                if (section.bendPoints) {
                    points.push(...section.bendPoints.map(translate));
                }
                points.push(translate(section.endPoint));
            }

            return {
                ...edge.originalEdge,
                source: edge.sources[0],
                target: edge.targets[0],
                data: {
                    ...edge.originalEdge.data,
                    points
                }
            };
        });

        return {
            nodes: flattenedNodes,
            edges: finalEdges,
            signature: input.signature
        };
    });
}