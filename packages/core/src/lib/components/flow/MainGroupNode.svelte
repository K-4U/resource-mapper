<script lang="ts">
    import type {FlowNodeData} from '$lib/utils/flow/types'
    import {Handle, type NodeProps, Position, type Node} from '@xyflow/svelte'
    import {goto} from '$app/navigation'
    import Icon from "@iconify/svelte";

    let {
        data,
        selected = false,
    }: NodeProps<Node<FlowNodeData>> = $props()

    //On double click, navigate to the group page.
    const navigateToGroupPage = () => {
        goto(`/group/${data.groupId}`);
    }

</script>


<Handle type="target" position={Position.Left} id="input" />
<Handle type="source" position={Position.Right} id="output" />
<div class="relative" ondblclick={() => navigateToGroupPage()} aria-label="Group node" aria-roledescription="Group node">
    {data.label}
</div>

