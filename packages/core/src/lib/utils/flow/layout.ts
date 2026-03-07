import ELK from 'elkjs/lib/elk.bundled.js';
import {type Edge, type Node} from '@xyflow/svelte';
import type {FlowEdgeData, FlowGraphInput, FlowGraphOutput, FlowNodeData} from '$shared/flow-types';
import type {ElkNode} from "elkjs/lib/elk-api";

const elk = new ELK();
const PADDING = 10;
export const OFFSET_STEP = 5;

/**
 * Helper to calculate absolute position of a node by traversing its parent chain.
 */
export function getAbsolutePosition(nodeId: string, nodes: Node<FlowNodeData>[]): { x: number, y: number } {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return {x: 0, y: 0};

    let x = node.position?.x ?? 0;
    let y = node.position?.y ?? 0;

    if (node.parentId) {
        const parentPos = getAbsolutePosition(node.parentId, nodes);
        x += parentPos.x;
        y += parentPos.y;
    }

    return {x, y};
}

/**
 * Calculates a deterministic offset for an edge to prevent overlapping.
 * TODO: Replace this method with elk's built-in edge routing and spacing options once we can guarantee it works well in all cases.
 * This probably means that we'll have to replace it once libavoid is integrated into elk: https://github.com/kieler/elkjs/issues/210
 * This function handles two types of offsets:
 * 1. Handle Offset: For multiple edges sharing the same handle on a node.
 * 2. Trunk Offset: For edges that don't share a handle but might have overlapping
 *    paths (trunks) in the same "lane".
 */
export function calculateEdgeOffset(
    edgeId: string,
    nodes: Node<FlowNodeData>[],
    edges: Edge<FlowEdgeData>[],
    isSource: boolean
): number {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return 0;

    const nodeId = isSource ? edge.source : edge.target;
    const handleId = isSource ? edge.sourceHandle : edge.targetHandle;

    const handle = isSource ? edge.sourceHandle : edge.targetHandle;
    const isVertical = handle?.toLowerCase().includes('top') || handle?.toLowerCase().includes('bottom');

    let finalSiblings: Edge<FlowEdgeData>[] = [];
    let usedAreaFallback = false;

    // HANDLE OFFSET: Siblings on the same node and same handle
    const siblings = edges.filter(e =>
        (isSource ? e.source : e.target) === nodeId &&
        (isSource ? e.sourceHandle : e.targetHandle) === handleId
    );

    if (siblings.length <= 1) {
        // Fallback for bidirectional or single edges between same nodes
        usedAreaFallback = true;
        const otherId = isSource ? edge.target : edge.source;
        finalSiblings = edges.filter(e => {
            const isSamePair = (e.source === nodeId && e.target === otherId) ||
                (e.source === otherId && e.target === nodeId);
            return isSamePair && (e.source === nodeId || e.target === nodeId);
        });
    } else {
        finalSiblings = siblings;
    }

    if (finalSiblings.length <= 1) return 0;

    // Sort:
    finalSiblings.sort((a, b) => {
        if (usedAreaFallback) {
            // For horizontal paths (Left/Right), we split them vertically by their overall Y midpoint
            const aSPos = getAbsolutePosition(a.source, nodes);
            const aTPos = getAbsolutePosition(a.target, nodes);
            const bSPos = getAbsolutePosition(b.source, nodes);
            const bTPos = getAbsolutePosition(b.target, nodes);

            if (isVertical) {
                const midA = (aSPos.x + aTPos.x) / 2;
                const midB = (bSPos.x + bTPos.x) / 2;
                if (midA !== midB) return midA - midB;
            } else {
                const midA = (aSPos.y + aTPos.y) / 2;
                const midB = (bSPos.y + bTPos.y) / 2;
                if (midA !== midB) return midA - midB;
            }
            return a.id.localeCompare(b.id);
        }
        const otherIdA = isSource ? a.target : a.source;
        const otherIdB = isSource ? b.target : b.source;
        const posA = getAbsolutePosition(otherIdA, nodes);
        const posB = getAbsolutePosition(otherIdB, nodes);
        const primary = isVertical ? (posA.x - posB.x) : (posA.y - posB.y);
        if (primary !== 0) return primary;
        return a.id.localeCompare(b.id);
    });

    const index = finalSiblings.findIndex(e => e.id === edgeId);
    return (index - (finalSiblings.length - 1) / 2) * OFFSET_STEP;
}

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
export function getNodeDimensions(node: Node<FlowNodeData>): { w: number, h: number } {
    const w = Math.round(node.measured?.width ?? node.width ?? 150);
    const h = Math.round(node.measured?.height ?? node.height ?? 40);
    return {w, h};
}


export async function layoutFlowGraph(input: FlowGraphInput): Promise<FlowGraphOutput> {
    const elkEdges = convertEdgesToElkEdges(input);
    // console.debug('[layoutFlowGraph] Starting layout with input:', {input});
    // Helper: Build node properties and handle dimensions
    const prepareElkNode = (node: Node<FlowNodeData>) => {
        const {w, h} = getNodeDimensions(node);
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
        const flattenedEdges: Edge<FlowEdgeData>[] = [];

        // Lookup maps to handle the coordinate system bridge
        const parentPosLookup = new Map<string, { x: number, y: number }>();
        const nodeToParent = new Map<string, string>();
        const nodeLookup = new Map<String, Node<FlowNodeData>>();

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
                    const node = {
                        ...child,
                        position: {x: child.x || 0, y: child.y || 0},
                        draggable: true,
                        extent: [[PADDING, 50], [(parentOrOrphan.width || 0) - PADDING, (parentOrOrphan.height || 0) - PADDING]]
                    } as Node<FlowNodeData>;
                    flattenedNodes.push(node);
                    nodeLookup.set(child.id, node);
                });
            } else {
                // It's a top-level orphan node
                const node = {
                    ...parentOrOrphan,
                    position: {x: px, y: py},
                    draggable: true,
                } as Node<FlowNodeData>;
                flattenedNodes.push(node);
                nodeLookup.set(node.id, node);
            }
        });

        const edges = input.edges.filter(e => e.data.connectionType !== 'service-group');

        return {
            nodes: flattenedNodes,
            edges,
            signature: input.signature
        };
    });
}
