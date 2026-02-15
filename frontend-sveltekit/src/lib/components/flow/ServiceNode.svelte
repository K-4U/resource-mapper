<script lang="ts">
    import type {FlowNodeData} from '$lib/utils/flow/types'
    import {Handle, Position} from '@xyflow/svelte'
    import {getAwsIconPath} from '$lib/utils/awsIcons'

    export let id!: string
    export let data!: FlowNodeData
    export let selected = false
    export let type: string | undefined = 'service'
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

    const initials = data.label
        ? data.label
            .split(' ')
            .map(part => part[0])
            .join('')
            .slice(0, 3)
            .toUpperCase()
        : 'Svc'
    //Todo: Figure out if we just want to hard-link the data format to the nodes
    //@ts-ignore
    const iconPath = getAwsIconPath(data.serviceType)
</script>

<Handle type="target" position={Position.Left} id="input" />
<Handle type="source" position={Position.Right} id="output"/>

<div class="flex items-center gap-3">
    {#if iconPath}
        <img src={iconPath} alt={data.label} class="h-10 w-10 rounded-lg bg-white/5 object-contain"
             loading="lazy"/>
    {:else}
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-xs font-semibold text-gray-200">
            {initials}
        </div>
    {/if}
    <div class="flex-1">
        <div class="text-sm font-semibold text-white">{data.label}</div>
    </div>
</div>
