<script lang="ts">
  export let title = 'Something went wrong'
  export let message = 'An unexpected error occurred.'
  export let checkList: string[] = []
  export let technicalDetails: string | Record<string, unknown> | null = null
  export let onRetry: (() => void) | null = null
  export let onBack: (() => void) | null = null

  $: formattedDetails = technicalDetails
    ? typeof technicalDetails === 'string'
      ? technicalDetails
      : JSON.stringify(technicalDetails, null, 2)
    : ''

  let copied = false

  async function copyDetails() {
    if (!formattedDetails) return
    await navigator.clipboard.writeText(formattedDetails)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }
</script>

<div class="flex h-full w-full items-center justify-center p-8">
  <div class="w-full max-w-2xl rounded-2xl border border-red-500/40 bg-red-500/10 p-6 shadow">
    <div class="flex items-center text-red-300">
      <span class="mr-2 text-2xl" aria-hidden="true">⚠️</span>
      <h2 class="text-xl font-semibold">{title}</h2>
    </div>
    <p class="mt-2 text-base text-gray-200">{message}</p>

    {#if checkList.length}
      <div class="mt-4 rounded-xl border border-gray-700/60 bg-gray-900/70 p-4">
        <p class="text-sm font-semibold text-gray-300">Please check:</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-400">
          {#each checkList as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if formattedDetails}
      <div class="mt-4 rounded-xl border border-gray-700/60 bg-gray-900/70 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-300">Technical details</span>
          <button class="text-sm text-blue-400 hover:text-blue-300" on:click={copyDetails}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre class="mt-2 max-h-48 overflow-auto rounded bg-black/40 p-3 text-xs text-gray-300">{formattedDetails}</pre>
      </div>
    {/if}

    <div class="mt-6 flex flex-wrap gap-3">
      {#if onRetry}
        <button class="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500" on:click={onRetry}>
          Retry
        </button>
      {/if}
      {#if onBack}
        <button class="rounded-md border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800" on:click={onBack}>
          Back
        </button>
      {/if}
    </div>
  </div>
</div>

