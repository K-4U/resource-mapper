<script lang="ts">
    import type {FlowNodeData} from '$lib/utils/flow/types'
    import {Handle, type NodeProps, Position, type Node} from '@xyflow/svelte'
    import {getAwsIconPath} from '$lib/utils/awsIcons'


    let {
        data,
    }: NodeProps<Node<FlowNodeData>> = $props()

    let initials = $derived(data.label
        ? data.label
            .split(' ')
            .map(part => part[0])
            .join('')
            .slice(0, 3)
            .toUpperCase()
        : 'Svc')

    //Todo: Figure out if we just want to hard-link the data format to the nodes
    //@ts-ignore
    let iconPath = $derived(getAwsIconPath(data.serviceType))
</script>

<Handle type="target" position={Position.Left} id="input" />
<Handle type="source" position={Position.Right} id="output"/>

<div class="flex items-center gap-3">
    {#if iconPath}
        <img src={iconPath} alt={data.label} class="h-10 w-10 rounded-lg bg-white/5 object-contain"
             loading="lazy"/>
    {:else}
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-xs font-semibold">
            {initials}
        </div>
    {/if}
    <div class="flex-1">
        <div class="text-sm font-semibold">{data.label}</div>
    </div>
</div>
