<script lang="ts">
    import {BaseEdge} from '@xyflow/svelte';

    export let data: { points: Array<{ x: number, y: number }> };
    export let id: string;
    export let style = "";

    console.log(data.points);

    // Convert ELK points into an SVG path: "M x1 y1 L x2 y2 L x3 y3..."
    $: path = data.points?.reduce((acc, point, i) => {
        const prefix = i === 0 ? 'M' : 'L';
        return `${acc} ${prefix} ${point.x} ${point.y}`;
    }, '') || '';

</script>

<BaseEdge {id} {path} style="stroke: #888; stroke-width: 2px;" />
