<script lang="ts">
    import type {FlowNodeData} from '$lib/utils/flow/types'
    import {Handle, Position} from '@xyflow/svelte'
    import Icon from '@iconify/svelte'

    export let id!: string
    export let data!: FlowNodeData
    export let selected = false
    export let type: string | undefined = 'group'
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


<Handle type="target" position={Position.Left} hidden/>
<Handle type="source" position={Position.Right} hidden/>
<div class="relative">
    {data.label}
    {#if selected}
        <a
            class="absolute top-1 right-1 cursor-pointer"
            href={`/group/${data.groupId}`}
            on:click|stopPropagation
            title="Go to group page"
        >
            <Icon icon="mdi:external-link" width="8" height="8" />
        </a>
    {/if}
</div>

<!--{#if data.subLabel}-->
<!--    <p class="text-xs text-gray-400">{data.subLabel}</p>-->
<!--{/if}-->
