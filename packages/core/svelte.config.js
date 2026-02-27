import adapter from '@sveltejs/adapter-static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const outDir = process.env.MAPPER_BUILD_OUT || 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: outDir,
			assets: outDir,
			fallback: "index.html",
			precompress: true,
			strict: true
		}),
		prerender: {
			entries: ['*']
		},
		alias: {
			$shared: path.resolve(dirname, '../shared/src'),
		}
	}
};

console.log(config);

export default config;