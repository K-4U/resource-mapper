<script lang="ts">

    import type {FlowNodeData} from '$lib/utils/flow/types'
    import {type Node, type NodeProps} from '@xyflow/svelte'

    let {
        data,
        width,
        height,
        selected = false,
    }: NodeProps<Node<FlowNodeData>> = $props()
</script>

<!--Todo: Add custom styling depending on what kind of group it is -->
<div class="custom-group-node" style:width="{width}px" style:height="{height}px">
    <div class="big-title">{data.label}</div>
</div>
