<script lang="ts">
    import { BaseEdge, type EdgeProps, getSmoothStepPath, EdgeLabel } from '@xyflow/svelte';

    let {
        id,
        data,
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        label, // Svelte Flow passes label here if defined in the edge object
        style,
    }: EdgeProps = $props();

    // 1. Derive the path
    let path = $derived.by(() => {
        return Array.isArray(data?.points) && data.points.length > 0
            ? 'M ' + data.points.map(p => `${p.x} ${p.y}`).join(' L ')
            : getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })[0];
    });

    let labelPos = $derived.by(() => {
        if (!data?.points || data.points.length < 2) {
            return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
        }

        let longestSegment = { start: data.points[0], end: data.points[1], length: 0 };

        for (let i = 0; i < data.points.length - 1; i++) {
            const p1 = data.points[i];
            const p2 = data.points[i + 1];
            // Calculate length of this segment
            const len = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

            // Preference: Longest segment, but prioritize horizontal ones (y1 == y2)
            const isHorizontal = Math.abs(p1.y - p2.y) < 1;
            const score = isHorizontal ? len * 2 : len;

            if (score > longestSegment.length) {
                longestSegment = { start: p1, end: p2, length: score };
            }
        }

        return {
            x: (longestSegment.start.x + longestSegment.end.x) / 2,
            y: (longestSegment.start.y + longestSegment.end.y) / 2
        };
    });
</script>

<BaseEdge
        {id}
        {path}
        style="{style}; stroke: #888; stroke-width: 2px; stroke-linejoin: round; stroke-linecap: round;"
/>

{#if label}
    <EdgeLabel>
        <div
                style:transform="translate(-50%, -50%) translate({labelPos.x}px, {labelPos.y}px)"
                class="edge-label"
        >
            {label}
        </div>
    </EdgeLabel>
{/if}
