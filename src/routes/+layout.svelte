<script lang="ts">
    import Header from '$lib/components/Header.svelte';
    import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
    import {navigating} from '$app/state';
    import './layout.css';
    import '../app.css';
    import favicon from '$lib/assets/favicon.svg';
    import { theme } from '$lib/state/theme.svelte';

    let { children } = $props();

    $effect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme.isDark);
        }
    });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Header />

{#if navigating.to}
    <LoadingOverlay message="Loading..." />
{/if}

<main class="w-full h-full px-6 py-6">
    {@render children()}
</main>
