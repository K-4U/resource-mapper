<script lang="ts">
  import { fade } from 'svelte/transition';

    let { message = 'Loading...', progress = null } = $props<{ message?: string, progress?: number | null }>()
    
    // Auto-progress simulation for indeterminate state
    let simulatedProgress = $state(0);
    $effect(() => {
        if (progress !== null) return;
        const interval = setInterval(() => {
            simulatedProgress = (simulatedProgress + 1) % 100;
        }, 30);
        return () => clearInterval(interval);
    });
</script>

<div class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/60 backdrop-blur-md" transition:fade={{ duration: 250 }}>
    <!-- Top progress bar -->
    <div class="fixed top-0 left-0 right-0 h-1 bg-gray-200/20 dark:bg-white/5 overflow-hidden">
        <div 
            class="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out" 
            style="width: {progress !== null ? progress : simulatedProgress}%"
        ></div>
    </div>

    <div class="flex flex-col items-center">
        <div class="h-16 w-16 animate-spin rounded-full border-4 border-gray-200/50 border-t-blue-500 dark:border-white/10 dark:border-t-blue-400"></div>
        <p class="mt-6 text-lg font-medium text-gray-800 dark:text-gray-100 tracking-wide">{message}</p>
    </div>
</div>

<style>
    @keyframes progress-indeterminate {
        0% { transform: translateX(-100%) scaleX(0.2); }
        50% { transform: translateX(0) scaleX(0.5); }
        100% { transform: translateX(100%) scaleX(0.2); }
    }

    .animate-progress-indeterminate {
        animation: progress-indeterminate 1.5s infinite linear;
    }
</style>
