import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vite';
import {sveltekit} from '@sveltejs/kit/vite';
import * as path from 'node:path';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import {mapperDataPlugin} from "./plugins/mapper-data-plugin.ts";
import {createRequire} from "node:module";
import {normalizePath} from "vite";

// Rename to avoid TS2441
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
        exclude: ['libavoid-js']
    },
    assetsInclude: ['**/*.wasm'],
});