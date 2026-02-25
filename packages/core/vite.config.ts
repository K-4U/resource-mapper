/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from "node:fs";
import { runBake } from '@mapper/engine/bake-logic';
import { normalizePath } from 'vite';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const wasmPath = normalizePath(path.resolve(dirname, '../../node_modules/libavoid-js/dist/libavoid.wasm'));
if (!fs.existsSync(wasmPath)) {
  throw new Error(`libavoid.wasm not found at ${wasmPath}. Please ensure libavoid-js is installed.`);
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    {
      name: 'data-bake-plugin',
      async buildStart() {
        console.log('[Vite] Initializing Data Bake...');
        try {
          await runBake();
          console.log('[Vite] Data Bake Successful.');
        } catch (err) {
          console.error('[Vite] Data Bake Failed:', err);
        }
      },
      async handleHotUpdate({ file, server }) {
        if (file.endsWith('.yaml')) {
          console.log(`[Vite] YAML change detected: ${file}. Re-baking...`);
          try {
            await runBake();
            server.ws.send({ type: 'full-reload' });
          } catch (err) {
            console.error('[Vite] Re-bake failed:', err);
          }
        }
      }
    },
    viteStaticCopy({
      targets: [
        {
          src: wasmPath,
          dest: '.'
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['libavoid-js']
  },
  assetsInclude: ['**/*.wasm'],
  test: {
    expect: {
      requireAssertions: true
    },
    projects: [{
      extends: './vite.config.ts',
      test: {
        name: 'client',
        browser: {
          enabled: true,
          provider: playwright(),
          instances: [{
            browser: 'chromium',
            headless: true
          }]
        },
        include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
        exclude: ['src/lib/server/**']
      }
    }, {
      extends: './vite.config.ts',
      test: {
        name: 'server',
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,ts}','scripts/**/*.{test,spec}.{js,ts}'],
        exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
      }
    }]
  }
});