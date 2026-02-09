<script lang="ts">
  import type { FlowNodeData } from '$lib/utils/flow/types'
  import { Handle, Position } from '@xyflow/svelte'

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
</script>

<div
  class={`relative rounded-2xl border px-4 py-3 text-left text-sm transition ${
    selected ? 'border-sky-400/80 bg-sky-500/10 shadow-lg' : 'border-white/10 bg-white/5'
  }`}
>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
  <div class="flex items-center gap-3">
    {#if data.iconPath}
      <img src={data.iconPath} alt={data.label} class="h-10 w-10 rounded-lg bg-white/5 object-contain" loading="lazy" />
    {:else}
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-xs font-semibold text-gray-200">
        {initials}
      </div>
    {/if}
    <div class="flex-1">
      <div class="text-sm font-semibold text-white">{data.label}</div>
      {#if data.subLabel}
        <p class="mt-0.5 text-xs text-gray-400">{data.subLabel}</p>
      {/if}
      {#if data.direction}
        <span class={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
          data.direction === 'incoming' ? 'bg-emerald-500/20 text-emerald-200' : data.direction === 'outgoing' ? 'bg-indigo-500/20 text-indigo-200' : 'bg-blue-500/20 text-blue-200'
        }`}
          >{data.direction}</span
        >
      {/if}
    </div>
  </div>
</div>
