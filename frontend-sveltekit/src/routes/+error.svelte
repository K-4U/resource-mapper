<script lang="ts">
import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
import { page } from '$app/stores';

let { error, status } = $props<{ error: Error; status: number }>();

const checkList = [
  "Check your internet connection",
  "Try refreshing the page",
  "Contact support if the issue persists"
];

const technicalDetails = $derived({
  status,
  message: error?.message,
  stack: error?.stack,
  url: $page.url.pathname
});

function handleRetry() {
  location.reload();
}
function handleBack() {
  history.back();
}
</script>

<ErrorDisplay
  title={status ? `Error ${status}` : 'Error'}
  message={error?.message ?? 'An unexpected error occurred.'}
  checkList={checkList}
  technicalDetails={technicalDetails}
  onRetry={handleRetry}
  onBack={handleBack}
/>

