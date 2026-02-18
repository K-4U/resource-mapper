<script lang="ts">
  let { message = 'Loading...' } = $props<{ message?: string }>()
</script>

<div class="flex h-full w-full items-center justify-center p-8 text-center">
  <div>
    <div class="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
    <p class="mt-4 text-base text-gray-500">{message}</p>
  </div>
</div>
