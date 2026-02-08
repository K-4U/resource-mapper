<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import mermaid from 'mermaid'
  import DiagramToolbar from '$lib/components/DiagramToolbar.svelte'
  import Legend from '$lib/components/Legend.svelte'
  import { withDiagramConfig } from '$lib/utils/mermaid/diagramHelpers'

  const DOUBLE_CLICK_THRESHOLD = 400

  export let diagram = ''
  export let pending = false
  export let label = ''
  export let showToolbar = true

  const dispatch = createEventDispatcher<{
    nodeClick: string
    nodeDoubleClick: string
    goHome: void
  }>()

  let container: HTMLDivElement | null = null
  let isDarkMode = false
  let showLegend = true
  let parseError = ''
  let lastClickedNode: string | null = null
  let lastClickTimestamp = 0
  let renderCounter = 0
  let mounted = false
  let emptyStateLabel = 'No diagram available.'
  let dataSignature = ''

  const normalizeNodeId = (nodeId: string) => nodeId.replace(/^flowchart-/, '').replace(/-\d+$/, '')

  function scheduleRender(reason: string) {
    if (!mounted) {
      return
    }
    renderCounter += 1
    const renderId = renderCounter
    console.debug('[FlowCanvas] scheduleRender', { reason, renderId })
    queueMicrotask(() => {
      if (mounted) {
        renderDiagram(renderId)
      }
    })
  }

  const handleResize = () => {
    scheduleRender('resize')
  }

  onMount(() => {
    mounted = true
    const stored = typeof window !== 'undefined' ? localStorage.getItem('preferredTheme') : null
    if (stored === 'dark') {
      isDarkMode = true
      document.documentElement.classList.add('dark')
    }
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: isDarkMode ? 'dark' : 'default' })
    const resizeObserver = new ResizeObserver(() => handleResize())
    if (container) {
      resizeObserver.observe(container)
    }
    window.addEventListener('resize', handleResize)
    scheduleRender('mount')
    return () => {
      mounted = false
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  })

  onDestroy(() => {
    mounted = false
  })

  $: if (mounted) {
    const signature = `${diagram?.trim() ?? ''}:${pending}`
    if (signature !== dataSignature) {
      dataSignature = signature
      console.debug('[FlowCanvas] data signature changed', signature)
      scheduleRender('data-change')
    }
  }

  async function renderDiagram(renderId?: number) {
    const targetRenderId = renderId ?? renderCounter
    console.debug('[FlowCanvas] renderDiagram invoked', { hasDiagram: !!diagram?.trim(), pending, targetRenderId })
    if (!container || !mounted) {
      return
    }
    if (!diagram?.trim()) {
      container.innerHTML = ''
      parseError = ''
      emptyStateLabel = pending ? 'Rendering diagram…' : 'No diagram available.'
      console.debug('[FlowCanvas] renderDiagram empty state', { pending })
      return
    }
    try {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: isDarkMode ? 'dark' : 'default' })
      const { svg } = await mermaid.render(`diagram-${targetRenderId}`, withDiagramConfig(diagram))
      container.innerHTML = svg
      console.debug('[FlowCanvas] renderDiagram success', { id: `diagram-${targetRenderId}` })
      attachNodeListeners()
      parseError = ''
    } catch (error) {
      parseError = error instanceof Error ? error.message : 'Failed to render diagram.'
      console.error('[FlowCanvas] renderDiagram error', error)
    }
  }

  function attachNodeListeners() {
    if (!container) return
    container.querySelectorAll('.node').forEach(node => {
      node.addEventListener('click', handleNodeClick as EventListener)
    })
  }

  function handleNodeClick(event: Event) {
    const target = event.currentTarget as HTMLElement | null
    if (!target?.id) {
      return
    }
    const rawNodeId = target.id
    const nodeId = normalizeNodeId(rawNodeId)
    const now = Date.now()
    console.debug('[FlowCanvas] node click received', { rawNodeId, nodeId })
    if (lastClickedNode === nodeId && now - lastClickTimestamp <= DOUBLE_CLICK_THRESHOLD) {
      dispatch('nodeDoubleClick', nodeId)
      console.debug('[FlowCanvas] double click emitted', nodeId)
      lastClickedNode = null
      lastClickTimestamp = 0
      return
    }
    lastClickedNode = nodeId
    lastClickTimestamp = now
    dispatch('nodeClick', nodeId)
  }

  function toggleLegend() {
    showLegend = !showLegend
    console.debug('[FlowCanvas] toggleLegend', showLegend)
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode
    console.debug('[FlowCanvas] toggleDarkMode', isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('preferredTheme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('preferredTheme', 'light')
    }
    scheduleRender('theme-change')
  }

  function logDiagram() {
    if (!diagram?.trim()) {
      console.info('[FlowCanvas] No diagram to log yet')
      return
    }
    console.info('[FlowCanvas]\n' + diagram)
  }

  function handleToolbarHome() {
    console.debug('[FlowCanvas] toolbar goHome triggered')
    dispatch('goHome')
  }
</script>

<div data-testid="flow-canvas" class="relative flex h-full flex-1 flex-col bg-gradient-to-b from-slate-950 to-slate-900">
  {#if showToolbar}
    <DiagramToolbar
      {pending}
      {label}
      {showLegend}
      {isDarkMode}
      on:goHome={handleToolbarHome}
      on:toggleLegend={toggleLegend}
      on:toggleDarkMode={toggleDarkMode}
      on:logDiagram={logDiagram}
    />
  {/if}

  <div class="relative flex-1 overflow-auto">
    <div bind:this={container} class="min-h-full p-4 text-white" aria-live="polite" aria-busy={pending}></div>
    {#if pending}
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-gray-200 backdrop-blur">
        Rendering diagram…
      </div>
    {:else if !diagram?.trim()}
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-gray-400">
        <span class="text-3xl" aria-hidden="true">🌀</span>
        <span>{emptyStateLabel}</span>
      </div>
    {/if}
    {#if showLegend && !pending}
      <div class="pointer-events-none absolute bottom-4 right-4"><Legend /></div>
    {/if}
  </div>

  {#if parseError}
    <div class="border-t border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{parseError}</div>
  {/if}
</div>
