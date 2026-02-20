import { writable, type Writable } from 'svelte/store';

export const selectedGroup: Writable<{ name: string } | null> = writable(null);
export const showLegend: Writable<boolean> = writable(true);
export const isDarkMode: Writable<boolean> = writable(false);
export const logDiagramAction = writable(0);
