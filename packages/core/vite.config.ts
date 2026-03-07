/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import {sveltekit} from '@sveltejs/kit/vite';
import * as path from 'node:path';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import {mapperDataPlugin} from "./plugins/mapper-data-plugin.ts";
import {createRequire} from "node:module";
import {normalizePath} from "vite";
import {sharedReporters, sharedCoverage} from "../../vitest.shared.js";

// 1. Rename to avoid TS2441
const cjsRequire = createRequire(import.meta.url);

const libAvoidPkgPath = cjsRequire.resolve('libavoid-js');
const libAvoidDir = path.dirname(libAvoidPkgPath);
const wasmPath = normalizePath(path.resolve(libAvoidDir, 'libavoid.wasm'));

export default defineConfig({
    plugins: [
        tailwindcss(),
        mapperDataPlugin(),
        sveltekit(),
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
        exclude: ['libavoid-js'],
        include: ['@maxgraph/core']
    },
    ssr: {
        noExternal: ['@maxgraph/core']
    },
    assetsInclude: ['**/*.wasm'],
    test: {
        expect: {
            requireAssertions: true
        },
        reporters: sharedReporters,
        outputFile: {
            junit: './coverage/junit.xml',
            json:  './coverage/test-results.json',
        },
        coverage: {
            ...sharedCoverage,
            reportsDirectory: './coverage',
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
                include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.{js,ts}'],
                exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
            }
        }]
    }
});