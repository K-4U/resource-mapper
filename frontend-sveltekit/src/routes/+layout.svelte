<script lang="ts">
	import './layout.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="flex min-h-screen flex-col bg-slate-950 text-gray-100">
  <header class="border-b border-white/5 bg-black/30 backdrop-blur">
    <div class="flex w-full items-center justify-between px-8 py-4">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-blue-400">Resource Mapper</p>
        <h1 class="text-2xl font-semibold text-white">Architecture Atlas</h1>
      </div>
      <nav class="hidden gap-4 text-sm text-gray-300 lg:flex">
        <a href="/" class="transition hover:text-white">Overview</a>
        <a href="/group/api" class="transition hover:text-white">Sample Group</a>
      </nav>
    </div>
  </header>
  <main class="flex flex-1 flex-col px-6 py-6 overflow-hidden">
    <div class="flex flex-1 min-h-0">
      {@render children()}
    </div>
  </main>
</div>
