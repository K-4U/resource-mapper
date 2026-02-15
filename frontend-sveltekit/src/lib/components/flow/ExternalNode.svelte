<script lang="ts">
    import type {FlowNodeData} from '$lib/utils/flow/types'
    import {Handle, Position} from '@xyflow/svelte'

    export let id!: string
    export let data!: FlowNodeData
    export let selected = false
    export let type: string | undefined = 'external'
    export let width: number | undefined = undefined
    export let height: number | undefined = undefined
    export let dragging: boolean | undefined = false
    export let draggable: boolean | undefined = true
    export let deletable: boolean | undefined = true
    export let selectable: boolean | undefined = true
    export let isConnectable: boolean | undefined = true
    export let parentId: string | undefined = undefined
    export let sourcePosition: string | undefined = undefined
    export let targetPosition: string | undefined = undefined
    export let dragHandle: string | undefined = undefined
    export let positionAbsoluteX: number | undefined = undefined
    export let positionAbsoluteY: number | undefined = undefined
    export let zIndex: number | undefined = undefined

    const _nodeMeta = {
        id,
        type,
        width,
        height,
        dragging,
        draggable,
        deletable,
        selectable,
        isConnectable,
        parentId,
        sourcePosition,
        targetPosition,
        dragHandle,
        positionAbsoluteX,
        positionAbsoluteY,
        zIndex
    }
</script>

<Handle type="target" position={Position.Left}/>
<Handle type="source" position={Position.Right}/>

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
