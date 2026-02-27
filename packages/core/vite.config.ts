/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import {sveltekit} from '@sveltejs/kit/vite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import fs from "node:fs";
import {normalizePath} from 'vite';
import {mapperDataPlugin} from "./plugins/mapper-data-plugin";

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const wasmPath = normalizePath(path.resolve(dirname, '../../node_modules/libavoid-js/dist/libavoid.wasm')); //TODO: make me dynamic
if (!fs.existsSync(wasmPath)) {
  throw new Error(`libavoid.wasm not found at ${wasmPath}. Please ensure libavoid-js is installed.`);
}

console.log('Dir path:', dirname);

export default defineConfig({
  plugins: [
    tailwindcss(),
    mapperDataPlugin(),
    sveltekit({
      configFile: path.resolve(dirname, 'svelte.config.js')
    }),
    viteStaticCopy({
      targets: [
        {
          src: wasmPath,
          dest: '.'
        }
      ]
    })
  ],
  server: {
    fs: {
      allow: ['.']
    }
  },
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