<script lang="ts">
    import type {FlowNodeData} from '$lib/utils/flow/types'
    import {Handle, type NodeProps, Position, type Node} from '@xyflow/svelte'
    import Icon from "@iconify/svelte";

    let {
        data,
        selected = false,
    }: NodeProps<Node<FlowNodeData>> = $props()

</script>


<Handle type="target" position={Position.Left} id="input" />
<Handle type="source" position={Position.Right} id="output" />
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

