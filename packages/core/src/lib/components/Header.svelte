<script lang="ts">
import { goto } from '$app/navigation';
import { selectedGroup, showLegend, logDiagramAction } from '$lib/stores/diagram';
import { theme } from '$lib/state/theme.svelte';
import { settings, setRenderer } from '$lib/state/settings.svelte';
import Icon from '@iconify/svelte';

function goHome() {
  goto('/');
}

function toggleLegend() {
  showLegend.update((v: boolean) => !v);
}

function toggleDarkMode() {
  theme.toggle();
}

function logDiagram() {
  logDiagramAction.update(n => n + 1);
}
</script>

<header class="border-b border-gray-200 bg-gray-200 dark:bg-black dark:border-white/10">
  <div class="flex w-full items-center justify-between px-8 py-4">
    <button class="cursor-pointer select-none text-left" onclick={goHome} aria-label="Go to home page">
      <span class="block text-xs big-title">Resource Mapper</span>
      <span class="block text-2xl font-semibold text-gray-900 dark:text-gray-100">Architecture Atlas</span>
    </button>
    <div class="flex-1 flex items-center justify-center big-title text-xl">
        {#if $selectedGroup}
          {$selectedGroup.name}
        {:else}
          Overview
        {/if}
    </div>
    <nav class="flex items-center gap-4">
      <button
        class="rounded px-3 py-1 text-sm font-medium border border-gray-400 dark:border-white/20 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-white/10 transition-colors"
        onclick={() => setRenderer(settings.renderer === 'svelteflow' ? 'maxgraph' : 'svelteflow')}
        title="Switch Renderer"
      >
        {settings.renderer === 'svelteflow' ? 'SvelteFlow' : 'MaxGraph'}
      </button>
      <span class="text-gray-700 dark:text-gray-200" onclick={toggleLegend} role="button" tabindex="0" onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleLegend()} title={$showLegend ? 'Hide Legend' : 'Show Legend'}>
        {#if $showLegend}
          <Icon icon="mdi:eye-off-outline" width="24" height="24" />
        {:else}
          <Icon icon="mdi:eye-outline" width="24" height="24" />
        {/if}
      </span>
      <span class="text-gray-700 dark:text-gray-200" onclick={toggleDarkMode} role="button" tabindex="0" onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDarkMode()} title={theme.isDark ? 'Light Mode' : 'Dark Mode'}>
        {#if theme.isDark}
          <Icon icon="mdi:weather-sunny" width="24" height="24" />
        {:else}
          <Icon icon="mdi:weather-night" width="24" height="24" />
        {/if}
      </span>
      <span class="text-gray-700 dark:text-gray-200" onclick={logDiagram} role="button" tabindex="0" onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && logDiagram()} title="Log Diagram">
        <Icon icon="mdi:bug-outline" width="24" height="24" />
      </span>
    </nav>
  </div>
</header>
