<script lang="ts">
    import {BaseEdge, EdgeLabel, type EdgeProps, Position, useEdges, useNodes} from '@xyflow/svelte';
    import {calculateEdgeOffset, getAbsolutePosition, getNodeDimensions} from '$lib/utils/flow/layout';
    import {page} from '$app/state';
    import {routingStore} from '$lib/stores/routingStore';
    import {onDestroy} from 'svelte';

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

    // Register nodes and edges with the routing store
    $effect(() => {
        const sourceNode = nodes.current.find(n => n.id === source);
        const targetNode = nodes.current.find(n => n.id === target);
        
        if (sourceNode) {
            const absPos = getAbsolutePosition(sourceNode.id, nodes.current);
            const { w, h } = getNodeDimensions(sourceNode);
            routingStore.registerNode({
                nodeId: sourceNode.id,
                absPos,
                width: w,
                height: h,
                isGroup: sourceNode.type === 'serviceGroup'
            });
        }
        
        if (targetNode) {
            const absPos = getAbsolutePosition(targetNode.id, nodes.current);
            const { w, h } = getNodeDimensions(targetNode);
            routingStore.registerNode({
                nodeId: targetNode.id,
                absPos,
                width: w,
                height: h,
                isGroup: targetNode.type === 'serviceGroup'
            });
        }
    });

    $effect(() => {
        // We rely on XYFlow props for positions, but we apply our calculated offsets
        let sX = sourceX;
        let sY = sourceY;
        let tX = targetX;
        let tY = targetY;

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

        routingStore.registerEdge({
            edgeId: id,
            sourceNodeId: source,
            targetNodeId: target,
            sourcePos: { x: sX, y: sY },
            sourceSide: sourcePosition ?? 'right',
            targetPos: { x: tX, y: tY },
            targetSide: targetPosition ?? 'left'
        });
    });

    onDestroy(() => {
        routingStore.unregisterEdge(id);
    });

    // 1. Derive the path and label position
    let pts = $derived($routingStore[id] || []);
    
    let edgePathData = $derived.by(() => {
        if (!pts || pts.length === 0) {
            // Fallback if not routed yet
            return { path: `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`, labelX: (sourceX + targetX) / 2, labelY: (sourceY + targetY) / 2 };
        }

        // Generate rounded SVG path from points
        let d = `M ${pts[0].x} ${pts[0].y}`;
        const radius = 8;

        for (let i = 0; i < pts.length - 1; i++) {
            const p = pts[i];
            const next = pts[i + 1];
            const prev = i > 0 ? pts[i - 1] : null;

            if (prev && next) {
                // Round this corner
                const dPrev = { x: p.x - prev.x, y: p.y - prev.y };
                const dNext = { x: next.x - p.x, y: next.y - p.y };
                const lenPrev = Math.hypot(dPrev.x, dPrev.y);
                const lenNext = Math.hypot(dNext.x, dNext.y);
                const actualRadius = Math.min(radius, lenPrev / 2, lenNext / 2);

                const startPoint = {
                    x: p.x - (dPrev.x / lenPrev) * actualRadius,
                    y: p.y - (dPrev.y / lenPrev) * actualRadius
                };
                const endPoint = {
                    x: p.x + (dNext.x / lenNext) * actualRadius,
                    y: p.y + (dNext.y / lenNext) * actualRadius
                };

                d += ` L ${startPoint.x} ${startPoint.y} Q ${p.x} ${p.y} ${endPoint.x} ${endPoint.y}`;
            } else if (i > 0) {
                d += ` L ${p.x} ${p.y}`;
            }
        }
        d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;

        // Label position: midpoint of the longest segment
        let longestLen = -1;
        let labelPos = { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
        for (let i = 0; i < pts.length - 1; i++) {
            const dx = pts[i + 1].x - pts[i].x;
            const dy = pts[i + 1].y - pts[i].y;
            const len = Math.hypot(dx, dy);
            if (len > longestLen) {
                longestLen = len;
                labelPos = { x: pts[i].x + dx / 2, y: pts[i].y + dy / 2 };
            }
        }
        return { path: d, labelX: labelPos.x, labelY: labelPos.y };
    });

    let path = $derived(edgePathData.path);
    let labelPos = $derived({ x: edgePathData.labelX, y: edgePathData.labelY });

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
        class={`snake-edge-path ${isEffectivelySelected ? 'selected' : ''} ${isConnectedNodeSelected ? 'animated' : ''} ${incomingOrOutgoingOrInternal ?? ''}`}
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
