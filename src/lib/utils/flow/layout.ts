import ELK, {type ElkExtendedEdge} from 'elkjs/lib/elk.bundled.js';
import {type Edge, type Node, Position} from '@xyflow/svelte';
import type {FlowEdgeData, FlowGraphInput, FlowGraphOutput, FlowNodeData} from '$lib/utils/flow/types';
import type {ElkNode} from "elkjs/lib/elk-api";

const elk = new ELK();
const PADDING = 10;
export const OFFSET_STEP = 8;

/**
 * Helper to calculate absolute position of a node by traversing its parent chain.
 */
function getAbsolutePosition(nodeId: string, nodes: Node<FlowNodeData>[]): { x: number, y: number } {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    let x = node.position?.x ?? 0;
    let y = node.position?.y ?? 0;

    if (node.parentId) {
        const parentPos = getAbsolutePosition(node.parentId, nodes);
        x += parentPos.x;
        y += parentPos.y;
    }

    return { x, y };
}

/**
 * Calculates a deterministic offset for an edge to prevent overlapping.
 * This function handles two types of offsets:
 * 1. Handle Offset: For multiple edges sharing the same handle on a node.
 * 2. Trunk Offset: For edges that don't share a handle but might have overlapping
 *    paths (trunks) in the same "lane".
 */
export function calculateEdgeOffset(
    edgeId: string,
    nodes: Node<FlowNodeData>[],
    edges: Edge<FlowEdgeData>[],
    isSource: boolean,
    isTrunk: boolean = false
): number {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return 0;

    const nodeId = isSource ? edge.source : edge.target;
    const handleId = isSource ? edge.sourceHandle : edge.targetHandle;

    const sourcePos = getAbsolutePosition(edge.source, nodes);
    const targetPos = getAbsolutePosition(edge.target, nodes);
    const handle = isSource ? edge.sourceHandle : edge.targetHandle;
    const isVertical = handle?.toLowerCase().includes('top') || handle?.toLowerCase().includes('bottom');

    let finalSiblings: Edge<FlowEdgeData>[] = [];
    let usedAreaFallback = false;

    if (isTrunk) {
        // TRUNK OFFSET: Consider ALL edges that might share this "lane"
        usedAreaFallback = true;
        finalSiblings = edges.filter(e => {
            const sPos = getAbsolutePosition(e.source, nodes);
            const tPos = getAbsolutePosition(e.target, nodes);

            if (isVertical) {
                // Vertical trunk: shared Y-range and roughly same mid-X?
                // For now, simpler: overlapping Y-range is the "lane"
                const minY = Math.min(sourcePos.y, targetPos.y);
                const maxY = Math.max(sourcePos.y, targetPos.y);
                const eMinY = Math.min(sPos.y, tPos.y);
                const eMaxY = Math.max(sPos.y, tPos.y);
                return Math.max(minY, eMinY) < Math.min(maxY, eMaxY);
            } else {
                // Horizontal trunk: shared X-range?
                const minX = Math.min(sourcePos.x, targetPos.x);
                const maxX = Math.max(sourcePos.x, targetPos.x);
                const eMinX = Math.min(sPos.x, tPos.x);
                const eMaxX = Math.max(sPos.x, tPos.x);
                return Math.max(minX, eMinX) < Math.min(maxX, eMaxX);
            }
        });
    } else {
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

        // 3. Just return the edges as is; Svelte Flow will handle the rendering
        return {
            nodes: flattenedNodes,
            edges: input.edges,
            signature: input.signature
        };
    });
}