<script lang="ts">
import { goto } from '$app/navigation';
import { selectedGroup, showLegend, isDarkMode, logDiagramAction } from '$lib/stores/diagram';
import Icon from '@iconify/svelte';

function goHome() {
  goto('/');
}

function toggleLegend() {
  showLegend.update((v: boolean) => !v);
}

function toggleDarkMode() {
  isDarkMode.update((v: boolean) => !v);
}

function logDiagram() {
  logDiagramAction.update(n => n + 1);
}
</script>

<header class="border-b border-gray-200 bg-white/80 backdrop-blur dark:bg-black/80 dark:border-white/10">
  <div class="flex w-full items-center justify-between px-8 py-4">
    <button class="cursor-pointer select-none text-left" on:click={goHome} aria-label="Go to home page">
      <span class="block text-xs big-title">Resource Mapper</span>
      <span class="block text-2xl font-semibold text-gray-900 dark:text-gray-100">Architecture Atlas</span>
    </button>
    <div class="flex-1 flex items-center justify-center">
      <span class="text-lg font-medium text-gray-600 dark:text-gray-200">
        {#if $selectedGroup}
          {$selectedGroup.name}
        {:else}
          Overview
        {/if}
      </span>
    </div>
    <nav class="flex items-center gap-4">
      <span data-testid="toolbar-legend" class="icon-btn text-gray-700 dark:text-gray-200" on:click={toggleLegend} role="button" tabindex="0" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleLegend()} title={$showLegend ? 'Hide Legend' : 'Show Legend'}>
        {#if $showLegend}
          <Icon icon="mdi:eye-off-outline" width="24" height="24" />
        {:else}
          <Icon icon="mdi:eye-outline" width="24" height="24" />
        {/if}
      </span>
      <span data-testid="toolbar-darkmode" class="icon-btn text-gray-700 dark:text-gray-200" on:click={toggleDarkMode} role="button" tabindex="0" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDarkMode()} title={$isDarkMode ? 'Light Mode' : 'Dark Mode'}>
        {#if $isDarkMode}
          <Icon icon="mdi:weather-sunny" width="24" height="24" />
        {:else}
          <Icon icon="mdi:weather-night" width="24" height="24" />
        {/if}
      </span>
      <span data-testid="toolbar-log" class="icon-btn text-gray-700 dark:text-gray-200" on:click={logDiagram} role="button" tabindex="0" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && logDiagram()} title="Log Diagram">
        <Icon icon="mdi:bug-outline" width="24" height="24" />
      </span>
    </nav>
  </div>
</header>
