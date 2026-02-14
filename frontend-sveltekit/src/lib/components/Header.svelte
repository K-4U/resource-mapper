<script lang="ts">
import { goto } from '$app/navigation';
import { selectedGroup, showLegend, isDarkMode, logDiagramAction } from '$lib/stores/diagram';
import { onMount } from 'svelte';
import Icon from '@iconify/svelte';

onMount(() => {
  if (typeof window !== 'undefined') {
    // Restore theme from localStorage
    const stored = localStorage.getItem('preferredTheme');
    if (stored === 'dark') isDarkMode.set(true);
    // Subscribe to dark mode changes and update <html> class
    isDarkMode.subscribe((dark) => {
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('preferredTheme', dark ? 'dark' : 'light');
    });
  }
});

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

<header class="border-b border-white/5 bg-black/30 backdrop-blur">
  <div class="flex w-full items-center justify-between px-8 py-4">
    <button class="cursor-pointer select-none text-left" on:click={goHome} aria-label="Go to home page">
      <span class="block text-xs uppercase tracking-[0.35em] text-blue-400">Resource Mapper</span>
      <span class="block text-2xl font-semibold text-white">Architecture Atlas</span>
    </button>
    <div class="flex-1 flex items-center justify-center">
      <span class="text-lg font-medium text-gray-300">
        {#if $selectedGroup}
          {$selectedGroup.name}
        {:else}
          Overview
        {/if}
      </span>
    </div>
    <nav class="flex items-center gap-4">
      <span data-testid="toolbar-legend" class="icon-btn" on:click={toggleLegend} role="button" tabindex="0" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleLegend()} title={$showLegend ? 'Hide Legend' : 'Show Legend'}>
        {#if $showLegend}
          <Icon icon="mdi:eye-off-outline" width="24" height="24" />
        {:else}
          <Icon icon="mdi:eye-outline" width="24" height="24" />
        {/if}
      </span>
      <span data-testid="toolbar-darkmode" class="icon-btn" on:click={toggleDarkMode} role="button" tabindex="0" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDarkMode()} title={$isDarkMode ? 'Light Mode' : 'Dark Mode'}>
        {#if $isDarkMode}
          <Icon icon="mdi:weather-sunny" width="24" height="24" />
        {:else}
          <Icon icon="mdi:weather-night" width="24" height="24" />
        {/if}
      </span>
      <span data-testid="toolbar-log" class="icon-btn" on:click={logDiagram} role="button" tabindex="0" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && logDiagram()} title="Log Diagram">
        <Icon icon="mdi:bug-outline" width="24" height="24" />
      </span>
    </nav>
  </div>
</header>

<style>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: none;
  color: #e5e7eb;
  cursor: pointer;
  transition: background 0.2s;
}
.icon-btn:hover {
  background: #334155;
}
</style>
