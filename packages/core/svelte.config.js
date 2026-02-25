import adapter from '@sveltejs/adapter-static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: "index.html",
			precompress: true,
			strict: true
		}),
		prerender: {
			entries: ['*']
		}
	},
	resolve: {
		alias: {
			$shared: path.resolve(dirname, '../shared/src'),
		},
	}
};

export default config;
