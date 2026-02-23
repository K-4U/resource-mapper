import {existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, renameSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import AdmZip from 'adm-zip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_URL = 'https://icon.icepanel.io/AWS/svg.zip';
const TARGET_DIR = join(__dirname, '..', 'static', 'icons', 'aws');
const STATUS_FILE = join(__dirname, '..', '.aws-icons-last-updated');
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 30000; // 30 seconds

export async function run() {
    if (existsSync(STATUS_FILE)) {
        const lastRun = new Date(readFileSync(STATUS_FILE, 'utf-8')).getTime();
        if (Date.now() - lastRun < WEEK_IN_MS) {
            console.log('AWS icons are up to date.');
            return;
        }
    }

    console.log('Updating AWS icons...');

    try {
        // Abort the request if it takes too long
        const response = await fetch(ICONS_URL, {signal: AbortSignal.timeout(TIMEOUT_MS)});
        if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

        const buffer = Buffer.from(await response.arrayBuffer());

        if (existsSync(TARGET_DIR)) rmSync(TARGET_DIR, {recursive: true, force: true});
        mkdirSync(TARGET_DIR, {recursive: true});

        const zip = new AdmZip(buffer);
        zip.extractAllTo(TARGET_DIR, true);

        // Flatten: if the zip has a single root folder, move everything up
        const items = readdirSync(TARGET_DIR);
        if (items.length === 1) {
            const subDir = join(TARGET_DIR, items[0]);
            readdirSync(subDir).forEach(file => {
                renameSync(join(subDir, file), join(TARGET_DIR, file));
            });
            rmSync(subDir, {recursive: true});
        } else if (items.length === 0) {
            console.log('No icons found in the ZIP.');
        }

        writeFileSync(STATUS_FILE, new Date().toISOString());
        console.log('AWS icons updated.');

    } catch (err) {
        const message = err instanceof Error && err.name === 'AbortError'
            ? 'Request timed out'
            : (err instanceof Error ? err.message : 'Unknown error');

        console.error(`Failed to update AWS icons: ${message}`);
        console.log('Icons are optional - the app will use text fallbacks.');
        console.log(`Manual download: ${ICONS_URL}`);
        console.log(`Extract to: ${TARGET_DIR}`);

        process.exit(0);
    }
}

/* v8 ignore next 3 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}