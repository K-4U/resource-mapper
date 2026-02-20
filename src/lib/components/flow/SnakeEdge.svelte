<script lang="ts">
    import {BaseEdge, type EdgeProps, getSmoothStepPath, EdgeLabel, useNodes, Position} from '@xyflow/svelte';

    let {
        id,
        data,
        source,
        target,
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

    let isConnectedNodeSelected = $derived.by(() => {
        const sourceNode = nodes.current.find((n) => n.id === source);
        const targetNode = nodes.current.find((n) => n.id === target);
        return sourceNode?.selected || targetNode?.selected;
    });

    let isEffectivelySelected = $derived(selected || isConnectedNodeSelected);

    // 1. Derive the path
    let path = $derived.by(() => {
        return Array.isArray(data?.points) && data.points.length > 0
            ? 'M ' + data.points.map(p => `${p.x} ${p.y}`).join(' L ')
            : getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })[0];
    });

    let labelPos: { x: number; y: number } = $derived.by(() => {
        if (!data?.points || data.points.length < 2) {
            return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
        }

        const segments = [];
        for (let i = 0; i < data.points.length - 1; i++) {
            const p1 = data.points[i];
            const p2 = data.points[i + 1];
            const len = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            segments.push({ start: p1, end: p2, length: len });
        }

        let targetSegment;

        // RULE: If exactly 3 segments, the middle one (index 1) is usually the "bridge"
        if (segments.length === 3) {
            targetSegment = segments[1];
        } else {
            // Fallback to your scoring calculation for complex paths
            let maxScore = -1;
            for (const seg of segments) {
                const isHorizontal = Math.abs(seg.start.y - seg.end.y) < 1;
                const score = isHorizontal ? seg.length * 2 : seg.length;

                if (score > maxScore) {
                    maxScore = score;
                    targetSegment = seg;
                }
            }
        }

        return {
            x: (targetSegment.start.x + targetSegment.end.x) / 2,
            y: (targetSegment.start.y + targetSegment.end.y) / 2
        };
    });
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
