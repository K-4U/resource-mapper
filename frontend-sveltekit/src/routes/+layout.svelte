<script lang="ts">
	import './layout.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="min-h-screen bg-slate-950/90 text-gray-100">
  <header class="border-b border-white/5 bg-black/30 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-blue-400">Resource Mapper</p>
        <h1 class="text-2xl font-semibold text-white">Architecture Atlas</h1>
      </div>
      <nav class="hidden gap-4 text-sm text-gray-300 sm:flex">
        <a href="/" class="transition hover:text-white">Overview</a>
        <a href="/group/api" class="transition hover:text-white">Sample Group</a>
      </nav>
    </div>
  </header>
  <main class="mx-auto min-h-[calc(100vh-88px)] max-w-6xl px-4 py-6">
    {@render children()}
  </main>
</div>
