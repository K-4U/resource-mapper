<script lang="ts">
    import { settings } from '$lib/state/settings.svelte'
    import SvelteFlowCanvas from './SvelteFlowCanvas.svelte'
    import MaxGraphCanvas from './MaxGraphCanvas.svelte'
    import type { FlowGraphInput } from '$shared/flow-types'

    let {
        graph = null,
        pending = false,
        onnodeDoubleClick
    } = $props<{
        graph?: FlowGraphInput | null;
        pending?: boolean;
        onnodeDoubleClick?: (nodeId: string) => void;
    }>()
</script>

{#if settings.renderer === 'svelteflow'}
    <SvelteFlowCanvas {graph} {pending} {onnodeDoubleClick} />
{:else}
    <MaxGraphCanvas {graph} {pending} {onnodeDoubleClick} />
{/if}

