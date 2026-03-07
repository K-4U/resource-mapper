import adapter from '@sveltejs/adapter-static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const outDir = process.env.MAPPER_BUILD_OUT || 'build';

// Resolve $shared to the published dist or the monorepo src as fallback
function resolveSharedAlias() {
  try {
    const pkgJsonPath = require.resolve('@k-4u/resource-mapper-shared/package.json');
    const pkgDir = path.dirname(pkgJsonPath);
    const distDir = path.join(pkgDir, 'dist');
    return distDir;
  } catch {
    // Fallback for edge cases where package resolution fails
    return path.resolve(dirname, '../shared/src');
  }
}

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
			$shared: resolveSharedAlias(),
		}
	}
};

export default config;