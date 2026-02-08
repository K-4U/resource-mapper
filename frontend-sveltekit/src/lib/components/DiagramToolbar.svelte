<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{
    goHome: void
    toggleLegend: void
    toggleDarkMode: void
    logDiagram: void
  }>()

  export let pending = false
  export let label = ''
  export let showLegend = true
  export let isDarkMode = false
</script>

<div class="flex items-center gap-3 border-b border-gray-800/60 bg-gray-950/70 px-4 py-2 text-sm text-gray-200">
  <button
    class="rounded-md border border-gray-700 px-3 py-1 text-gray-100 transition hover:bg-gray-800"
    on:click={() => dispatch('goHome')}
    disabled={pending}
  >
    Home
  </button>

  {#if label}
    <div class="text-sm text-gray-400">{label}</div>
  {/if}

  <div class="ml-auto flex items-center gap-2">
    <button
      class="rounded-md border border-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-800"
      on:click={() => dispatch('toggleLegend')}
      disabled={pending}
    >
      {showLegend ? 'Hide legend' : 'Show legend'}
    </button>
    <button
      class="rounded-md border border-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-800"
      on:click={() => dispatch('toggleDarkMode')}
      disabled={pending}
    >
      {isDarkMode ? 'Light mode' : 'Dark mode'}
    </button>
    <button
      class="rounded-md border border-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-800"
      on:click={() => dispatch('logDiagram')}
      disabled={pending}
    >
      Log
    </button>
  </div>
</div>

