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
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.portConstraints': 'FREE',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
};

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
    const elkChildren: ElkNode[] = input.groupNodes.map(parent => ({
        ...parent,
        layoutOptions: {
            ...ELK_OPTIONS,
            'elk.padding': `[top=60,left=${PADDING},bottom=${PADDING},right=${PADDING}]`
        },
        children: input.serviceNodes.filter(child => child.parentId === parent.id)
    }));

    // Add nodes that aren't in any group
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
        const allLayoutedEdges: (ElkExtendedEdge & { originalEdge: Edge<FlowEdgeData> })[] = [];

        // Lookup maps to handle the coordinate system bridge
        const parentPosLookup = new Map<string, { x: number, y: number }>();
        const nodeToParent = new Map<string, string>();

        // 2. Process the results
        layoutedGraph.children?.forEach(parentOrOrphan => {
            const px = parentOrOrphan.x || 0;
            const py = parentOrOrphan.y || 0;

            // If it has children, it's a group node in our context
            if (parentOrOrphan.children) {
                parentPosLookup.set(parentOrOrphan.id, { x: px, y: py });

                flattenedNodes.push({
                    ...parentOrOrphan,
                    position: { x: px, y: py },
                    draggable: true,
                } as Node<FlowNodeData>);

                // Map children and record their parent for edge offsetting
                parentOrOrphan.children.forEach(child => {
                    nodeToParent.set(child.id, parentOrOrphan.id);
                    flattenedNodes.push({
                        ...child,
                        position: { x: child.x || 0, y: child.y || 0 },
                        draggable: true,
                        extent: [[PADDING, 50], [(parentOrOrphan.width || 0) - PADDING, (parentOrOrphan.height || 0) - PADDING]]
                    } as Node<FlowNodeData>);
                });

                // Collect edges found inside this parent
                if (parentOrOrphan.edges) {
                    allLayoutedEdges.push(...(parentOrOrphan.edges as any));
                }
            } else {
                // It's a top-level orphan node
                flattenedNodes.push({
                    ...parentOrOrphan,
                    position: { x: px, y: py },
                    draggable: true,
                } as Node<FlowNodeData>);
            }
        });

        // Collect edges found at the root level
        if (layoutedGraph.edges) {
            allLayoutedEdges.push(...(layoutedGraph.edges as any));
        }

        // 3. Globalize Edge Points
        const finalEdges: Edge<FlowEdgeData>[] = allLayoutedEdges.map((edge) => {
            const section = edge.sections?.[0];
            const points: ElkPoint[] = [];

            if (section) {
                const sourceId = edge.sources[0];
                const targetId = edge.targets[0];

                const sourceParentId = nodeToParent.get(sourceId);
                const targetParentId = nodeToParent.get(targetId);

                // THE LOGIC FIX:
                // Only apply an offset if BOTH nodes are in the SAME parent.
                // If they are in different parents, ELK already routed them in global space.
                let offset = { x: 0, y: 0 };

                if (sourceParentId && sourceParentId === targetParentId) {
                    const parentPos = parentPosLookup.get(sourceParentId);
                    if (parentPos) {
                        offset = parentPos;
                    }
                }

                const translate = (p: ElkPoint) => ({
                    x: p.x + offset.x,
                    y: p.y + offset.y
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