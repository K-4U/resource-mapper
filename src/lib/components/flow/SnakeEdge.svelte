<script lang="ts">
    import {
        BaseEdge,
        type EdgeProps,
        EdgeLabel,
        useNodes,
        useEdges,
        Position,
        type Edge,
        useInternalNode
    } from '@xyflow/svelte';
    import {calculateEdgeOffset, routeWithLibAvoid} from '$lib/utils/flow/layout';
    import { page } from '$app/state';
    import type {FlowEdgeData} from "$lib/utils/flow/types";

    let {
        id,
        data,
        source,
        target,
        sourceHandleId,
        targetHandleId,
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        label,
        style,
        selected
    }: EdgeProps = $props();

    const nodes = useNodes();
    const edges = useEdges();

    let isConnectedNodeSelected = $derived.by(() => {
        const sourceNode = nodes.current.find((n) => n.id === source);
        const targetNode = nodes.current.find((n) => n.id === target);
        return sourceNode?.selected || targetNode?.selected;
    });

    let isEffectivelySelected = $derived(selected || isConnectedNodeSelected);

    let sourceOffset = $derived(calculateEdgeOffset(id, nodes.current, edges.current, true));
    let targetOffset = $derived(calculateEdgeOffset(id, nodes.current, edges.current, false));

    // 1. Derive the path and label position
    let edgePathData = $derived.by(async () => {
        const sourceNode = nodes.current.find((n) => n.id === source);
        const targetNode = nodes.current.find((n) => n.id === target);
        const edge = edges.current.find((e) => e.id === id);

        let sX = sourceX;
        let sY = sourceY;
        let tX = targetX;
        let tY = targetY;

        console.debug('sourceX:', sourceX, 'sourceY:', sourceY, 'targetX:', targetX, 'targetY:', targetY, id);

        if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
            sY += sourceOffset;
        } else {
            sX += sourceOffset;
        }

        if (targetPosition === Position.Left || targetPosition === Position.Right) {
            tY += targetOffset;
        } else {
            tX += targetOffset;
        }

        const pts = await routeWithLibAvoid(sourceNode, targetNode, {x: sX, y: sY}, sourcePosition, {x: tX, y: tY}, targetPosition, nodes.current, edge);
        if (!pts || pts.length === 0) {
            return { path: `M ${sX} ${sY} L ${tX} ${tY}`, labelX: (sX + tX) / 2, labelY: (sY + tY) / 2 };
        }

        // Generate direct SVG path from points
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            d += ` L ${pts[i].x} ${pts[i].y}`;
        }
        // Label position: midpoint of the longest segment
        let longestLen = -1;
        let label = { x: (sX + tX) / 2, y: (sY + tY) / 2 };
        for (let i = 0; i < pts.length - 1; i++) {
            const dx = pts[i + 1].x - pts[i].x;
            const dy = pts[i + 1].y - pts[i].y;
            const len = Math.hypot(dx, dy);
            if (len > longestLen) {
                longestLen = len;
                label = { x: pts[i].x + dx / 2, y: pts[i].y + dy / 2 };
            }
        }
        return { path: d, labelX: label.x, labelY: label.y };
    });

    let path = $state('');
    let labelPos = $state({ x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 });

    $effect(() => {
        edgePathData.then(data => {
            path = data.path;
            labelPos = { x: data.labelX, y: data.labelY };
        });
    });

    let incomingOrOutgoingOrInternal = $derived.by(() => {
        const urlGroupId = page.params.groupId;

        if (!urlGroupId) {
            return null;
        }

        // Determine if the edge is incoming, outgoing, or internal based on the handle ids, and if the group is the same.
        //Assume that a node id is in the format of "svc::<group>::<service>".
        const sourceGroup = source.split('::')[1];
        const targetGroup = target.split('::')[1];

        if (sourceGroup === targetGroup) {
            return 'internal';
        } else if (sourceHandleId === 'output' && sourceGroup === urlGroupId) {
            return 'outgoing';
        } else if (targetHandleId === 'input' && targetGroup === urlGroupId) {
            return 'incoming';
        } else {
            return 'internal';
        }
    });

</script>

<BaseEdge
        class={`${isEffectivelySelected ? 'snake-edge-path selected' : 'snake-edge-path'} ${incomingOrOutgoingOrInternal ?? ''}`}
        {id}
        {path}
        {style}
/>

{#if label}
    <EdgeLabel>
        <div
                style:transform="translate(-50%, -50%) translate({labelPos.x}px, {labelPos.y}px)"
                class="edge-label"
                class:selected={isEffectivelySelected}
        >
            {label}
        </div>
    </EdgeLabel>
{/if}
