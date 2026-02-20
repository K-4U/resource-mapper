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
        return getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })[0];
    });

    let labelPos: { x: number; y: number } = $derived.by(() => {
        return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
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
