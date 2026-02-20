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
<Header />
<main class="w-full h-full px-6 py-6">
    {@render children()}
</main>
