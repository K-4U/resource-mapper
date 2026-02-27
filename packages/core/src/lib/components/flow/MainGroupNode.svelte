<script lang="ts">
    import type {FlowNodeData} from '$shared/flow-types'
    import {Handle, type Node, type NodeProps, Position} from '@xyflow/svelte'
    import {goto} from '$app/navigation'

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

