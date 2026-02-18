<script lang="ts">
    import type {FlowNodeData} from '$lib/utils/flow/types'
    import {Handle, type NodeProps, Position, type Node} from '@xyflow/svelte'

    let {
        data,
        selected = false,
    }: NodeProps<Node<FlowNodeData>> = $props()

</script>

<Handle type="target" position={Position.Left} id="input" />
<Handle type="source" position={Position.Right} id="output"/>

<div class="flex items-center justify-between text-xs uppercase tracking-wide text-amber-200">
    <span>External</span>
    {#if data.direction}
        <span class="rounded-full bg-amber-400/20 px-2 py-0.5 font-semibold">{data.direction}</span>
    {/if}
</div>
<div class="mt-2 text-lg font-semibold text-white">{data.label}</div>
{#if data.subLabel}
    <p class="mt-1 text-xs text-amber-100/70">{data.subLabel}</p>
{/if}
