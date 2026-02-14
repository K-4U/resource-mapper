<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import './layout.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { isDarkMode } from '$lib/stores/diagram';
	import { onMount } from 'svelte';

	let { children } = $props();

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
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-slate-950 dark:text-gray-100">
	<Header />
	<main class="flex flex-1 flex-col px-6 py-6 overflow-hidden bg-gray-50 dark:bg-slate-900">
		<div class="flex flex-1 min-h-0">
			<div class="flex flex-1 min-h-0">
				{@render children()}
			</div>
		</div>
	</main>
</div>
