import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/**/*.ts', '!src/**/*.test.ts'],

    format: ['esm'],
    target: 'node22',
    platform: 'node',
    bundle: false,
    clean: true,
    shims: true,
    sourcemap: true,

    outDir: 'dist',
});