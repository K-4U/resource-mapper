<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Home, Eye, EyeOff, Sun, Moon, ScrollText } from 'lucide-svelte'

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
    class="flex items-center gap-2 rounded-md border border-gray-700 px-3 py-1 text-gray-100 transition hover:bg-gray-800"
    on:click={() => dispatch('goHome')}
    disabled={pending}
  >
    <Home class="h-4 w-4" aria-hidden="true" />
    <span>Home</span>
  </button>

  {#if label}
    <div class="text-sm text-gray-400">{label}</div>
  {/if}

  <div class="ml-auto flex items-center gap-2">
    <button
      class="flex items-center gap-2 rounded-md border border-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-800"
      on:click={() => dispatch('toggleLegend')}
      disabled={pending}
    >
      {#if showLegend}
        <EyeOff class="h-4 w-4" aria-hidden="true" />
        <span>Hide legend</span>
      {:else}
        <Eye class="h-4 w-4" aria-hidden="true" />
        <span>Show legend</span>
      {/if}
    </button>
    <button
      class="flex items-center gap-2 rounded-md border border-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-800"
      on:click={() => dispatch('toggleDarkMode')}
      disabled={pending}
    >
      {#if isDarkMode}
        <Sun class="h-4 w-4" aria-hidden="true" />
        <span>Light mode</span>
      {:else}
        <Moon class="h-4 w-4" aria-hidden="true" />
        <span>Dark mode</span>
      {/if}
    </button>
    <button
      class="flex items-center gap-2 rounded-md border border-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-800"
      on:click={() => dispatch('logDiagram')}
      disabled={pending}
    >
      <ScrollText class="h-4 w-4" aria-hidden="true" />
      <span>Log</span>
    </button>
  </div>
</div>
