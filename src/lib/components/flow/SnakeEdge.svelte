<script lang="ts">
    import {BaseEdge, type EdgeProps, getSmoothStepPath, EdgeLabel, useNodes, useEdges, Position} from '@xyflow/svelte';
    import {calculateEdgeOffset} from '$lib/utils/flow/layout';

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
    let trunkOffset = $derived(calculateEdgeOffset(id, nodes.current, edges.current, true, true));

    // 1. Derive the path and label position
    let edgePathData = $derived.by(() => {
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

        const params: any = {
            sourceX: sX,
            sourceY: sY,
            sourcePosition,
            targetX: tX,
            targetY: tY,
            targetPosition
        };

        // If it's a left/right connection, apply trunkOffset to the centerX to split the vertical trunk
        if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
            params.centerX = (sX + tX) / 2 + trunkOffset;
        } else {
            // For top/bottom, apply to the centerY to split the horizontal trunk
            params.centerY = (sY + tY) / 2 + trunkOffset;
        }

        const [path, labelX, labelY] = getSmoothStepPath(params);
        return {path, labelX, labelY};
    });

    let path = $derived(edgePathData.path);
    let labelPos = $derived({ x: edgePathData.labelX, y: edgePathData.labelY });
</script>

<BaseEdge
        class={isEffectivelySelected ? 'snake-edge-path selected' : 'snake-edge-path'}
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
