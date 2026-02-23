<script lang="ts">

    import type {Snippet} from "svelte";

    const {title, subtitle, description, children, iconPath, iconAlt, classes} = $props<{
        title: string,
        subtitle?: string,
        description?: string,
        children?: Snippet,
        iconPath?: string,
        iconAlt?: string,
        classes?: string
    }>();


</script>

<div class="sidebar-card {classes}">
    <div class="flex items-start justify-between">
        <div class="flex flex-col">
            <div class="sidebar-card-title">{title}</div>
            {#if subtitle}
                <h3 class="sidebar-card-subtitle">{subtitle}</h3>
            {/if}
        </div>
        {#if iconPath}
            <img
                    src={iconPath}
                    alt={iconAlt}
                    class="h-10 w-10 rounded-lg bg-white/5 object-contain"
            />
        {:else if iconAlt}
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-xs font-semibold text-gray-200">
                {iconAlt}
            </div>
        {/if}
    </div>
    {#if description}
        <p class="sidebar-card-contents">{description}</p>
    {/if}
    {#if children}
        {@render children()}
    {/if}
</div>