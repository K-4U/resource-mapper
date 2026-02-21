import { writable, type Writable } from 'svelte/store';
import type {GroupInfo} from "$lib/types";

export const selectedGroup: Writable<GroupInfo | null> = writable(null);
export const showLegend: Writable<boolean> = writable(true);
export const isDarkMode: Writable<boolean> = writable(false);
export const logDiagramAction = writable(0);
