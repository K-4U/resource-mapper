import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/**/*.ts', '!src/**/*.test.ts'],

    format: ['esm'],
    target: 'node22',
    platform: 'node',
    bundle: false, // Keep this false to avoid the "events" error
    clean: true,
    shims: true,
    sourcemap: true,
    noExternal: [/.*/],

    // This ensures the folder structure in 'src' is mirrored in 'dist'
    outDir: 'dist',
});