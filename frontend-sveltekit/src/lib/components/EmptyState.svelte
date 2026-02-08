Y<script lang="ts">
  export let icon = '📦'
  export let title = 'Nothing to show'
  export let message = ''
  export let actionLabel: string | null = null
  export let onAction: (() => void) | null = null
</script>

<div class="flex h-full w-full items-center justify-center p-8">
  <div class="max-w-md rounded-xl border border-gray-200 bg-white/5 p-8 text-center shadow">
    <div class="text-4xl" aria-hidden="true">{icon}</div>
    <h2 class="mt-4 text-xl font-semibold text-gray-100">{title}</h2>
    {#if message}
      <p class="mt-2 text-base text-gray-400">{message}</p>
    {/if}
    {#if actionLabel && onAction}
      <button
        class="mt-6 w-full rounded-md bg-blue-600 py-2 text-white transition hover:bg-blue-500"
        on:click={onAction}
      >
        {actionLabel}
      </button>
    {/if}
  </div>
</div>
