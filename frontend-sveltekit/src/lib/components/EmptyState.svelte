<script lang="ts">
  import Icon from '@iconify/svelte';

  export let title = 'Nothing to show'
  export let message = ''
  export let actionLabel: string | null = null
  export let onAction: (() => void) | null = null
</script>

<div class="flex h-full w-full items-center justify-center p-8">
  <div class="max-w-md rounded-xl border border-gray-200 bg-gray-100 dark:bg-slate-800 p-8 text-center shadow">
    <div class="flex items-center justify-center mb-4">
      <Icon icon="mdi:package-variant" class="text-4xl text-gray-400 dark:text-gray-300" aria-hidden="true" />
    </div>
    <h2 class="big-title text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    {#if message}
      <p class="mt-2 text-base text-gray-700 dark:text-gray-300">{message}</p>
    {/if}
    {#if actionLabel && onAction}
      <button
        class="mt-6 w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-500"
        on:click={onAction}
      >
        {actionLabel}
      </button>
    {/if}
  </div>
</div>
