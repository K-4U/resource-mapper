<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import './layout.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="flex min-h-screen flex-col bg-slate-950 text-gray-100">
  <Header />
  <main class="flex flex-1 flex-col px-6 py-6 overflow-hidden">
    <div class="flex flex-1 min-h-0">
      {@render children()}
    </div>
  </main>
</div>
