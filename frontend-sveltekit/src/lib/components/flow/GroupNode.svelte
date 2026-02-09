<script lang="ts">
  import type { FlowNodeData } from '$lib/utils/flow/types'
  import { Handle, Position } from '@xyflow/svelte'

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

<div
  class={`relative flex min-w-[240px] max-w-[320px] flex-col gap-1 rounded-2xl border px-4 py-3 text-left text-sm transition ${
    selected ? 'border-blue-400/80 bg-blue-500/10 shadow-lg' : 'border-white/10 bg-white/5'
  }`}
>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
  <span class="text-[11px] uppercase tracking-wide text-gray-400">Group</span>
  <div class="text-base font-semibold leading-tight text-white break-words">{data.label}</div>
  {#if data.subLabel}
    <p class="text-xs text-gray-400">{data.subLabel}</p>
  {/if}
</div>
