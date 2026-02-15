import ELK, {type ElkExtendedEdge} from 'elkjs/lib/elk.bundled.js'
import type {Edge, Node} from '@xyflow/svelte'
import type {FlowEdgeData, FlowGraphInput, FlowGraphOutput, FlowNodeData} from '$lib/utils/flow/types'
import type {ElkNode} from "elkjs/lib/elk-api";

const elk = new ELK()
const PADDING = 10;

const ELK_OPTIONS: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.spacing.nodeNode': '80'
};

function convertEdgesToElkEdges(input: FlowGraphInput): ElkEdgeWithData[] {
    return input.edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
        originalEdge: edge
    }));
}

type ElkNodeWithData = ElkNode & { data: FlowNodeData };
type ElkEdgeWithData = ElkExtendedEdge & { originalEdge: Edge<FlowEdgeData> };

export async function layoutFlowGraph(input: FlowGraphInput): Promise<FlowGraphOutput> {
    const elkEdges = convertEdgesToElkEdges(input);

    // 1. Separate parents and children
    const parentNodes = input.groupNodes;
    const childNodes = input.serviceNodes;

    // 2. Build the nested ELK structure
    const elkChildren: ElkNodeWithData[] = parentNodes.map(parent => ({
        ...parent,
        layoutOptions: {
            ...ELK_OPTIONS,
            'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            'elk.padding': `[top=60,left=${PADDING},bottom=${PADDING},right=${PADDING}]`
        }, // Tell ELK to look inside
        children: childNodes.filter(child => child.parentId === parent.id)
    }));

    childNodes.filter(child => child.parentId === undefined).forEach(node => {
        elkChildren.push(node)
    });


    const elkGraph = {
        id: 'root',
        layoutOptions: ELK_OPTIONS,
        children: elkChildren,
        edges: elkEdges
    }

    return elk.layout(elkGraph).then((layoutedGraph) => {
        // 3. Flatten it back out for Svelte Flow
        const flattenedNodes: Node<FlowNodeData>[] = [];

        layoutedGraph.children?.forEach(parent => {
            // Add the parent
            flattenedNodes.push({
                ...parent,
                position: {x: parent.x || 0, y: parent.y || 0},
                draggable: true,
            });

            // Add the children
            parent.children?.forEach(child => {
                // @ts-ignore
                flattenedNodes.push({
                    ...child,
                    // IMPORTANT: ELK returns child coordinates RELATIVE to the parent
                    position: {x: child.x || 0, y: child.y || 0},
                    draggable: true,
                    extent: parent
                        // @ts-ignore: We ignore warnings about missing width/height
                        ? [[PADDING, 50], [parent.width - PADDING, parent.height - PADDING]] // [Top-Left, Bottom-Right]
                        : undefined
                });
            });
        });

        return {
            nodes: flattenedNodes,
            edges: layoutedGraph.edges.map(edge => ({...edge.originalEdge})),
            signature: input.signature
        };
    });
}
