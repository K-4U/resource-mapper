import ELK, {type ElkExtendedEdge} from 'elkjs/lib/elk.bundled.js';
import type {Edge, Node} from '@xyflow/svelte';
import type {FlowEdgeData, FlowGraphInput, FlowGraphOutput, FlowNodeData} from '$lib/utils/flow/types';
import type {ElkNode} from "elkjs/lib/elk-api";

const elk = new ELK();
const PADDING = 10;

const ELK_OPTIONS: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    //Horizontal
    'elk.spacing.nodeNodeBetweenLayers': '80',
    //Vertical
    'elk.spacing.nodeNode': '80',

    'elk.spacing.edgeNode': '60',               // Gap between lines and boxes
    'elk.spacing.edgeEdge': '40',               // Gap between parallel lines

    'elk.layered.spacing.edgeNodeBetweenLayers': '60',
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
        originalEdge: edge,
    }));
}

/**
 * Helper to get the dimensions of a node, prioritizing measured values from Svelte Flow.
 */
function getNodeDimensions(node: Node<FlowNodeData>): { w: number, h: number } {
    const w = Math.round(node.measured?.width ?? node.width ?? 150);
    const h = Math.round(node.measured?.height ?? node.height ?? 40);
    return { w, h };
}


export async function layoutFlowGraph(input: FlowGraphInput): Promise<FlowGraphOutput> {
    const elkEdges = convertEdgesToElkEdges(input);
    console.debug('[layoutFlowGraph] Starting layout with input:', {input});
    // Helper: Build node properties and handle dimensions
    const prepareElkNode = (node: Node<FlowNodeData>) => {
        const { w, h } = getNodeDimensions(node);
        return {
            ...node,
            width: w,
            height: h
        };
    };

    // 1. Build the nested ELK structure
    const elkChildren: ElkNode[] = input.groupNodes.map(parent => ({
        ...prepareElkNode(parent),
        layoutOptions: {
            ...ELK_OPTIONS,
            'elk.padding': `[top=60,left=${PADDING},bottom=${PADDING},right=${PADDING}]`,
        },
        children: input.serviceNodes.filter(child => child.parentId === parent.id).map(prepareElkNode)
    }));

    // Add nodes that aren't in any group
    input.serviceNodes
        .filter(child => child.parentId === undefined)
        .forEach(node => elkChildren.push(prepareElkNode(node)));

    const elkGraph = {
        id: 'root',
        layoutOptions: ELK_OPTIONS,
        children: elkChildren,
        edges: elkEdges
    };

    return elk.layout(elkGraph).then(async (layoutedGraph) => {
        console.debug('[layoutFlowGraph] Layout completed:', {layoutedGraph});
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
                parentPosLookup.set(parentOrOrphan.id, {x: px, y: py});

                flattenedNodes.push({
                    ...parentOrOrphan,
                    position: {x: px, y: py},
                    draggable: true,
                } as Node<FlowNodeData>);

                // Map children and record their parent for edge offsetting
                parentOrOrphan.children.forEach(child => {
                    nodeToParent.set(child.id, parentOrOrphan.id);
                    flattenedNodes.push({
                        ...child,
                        position: {x: child.x || 0, y: child.y || 0},
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
                    position: {x: px, y: py},
                    draggable: true,
                } as Node<FlowNodeData>);
            }
        });

        // Collect edges found at the root level
        if (layoutedGraph.edges) {
            allLayoutedEdges.push(...(layoutedGraph.edges as any));
        }

        console.debug(allLayoutedEdges);

        // 3. Just return the edges as is; Svelte Flow will handle the rendering
        return {
            nodes: flattenedNodes,
            edges: input.edges,
            signature: input.signature
        };
    });
}