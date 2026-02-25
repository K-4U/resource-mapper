import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';


import {GroupService} from '../src/lib/services/GroupService.js';
import {ServicesService} from '../src/lib/services/ServicesService.js';
import {TeamsService} from '../src/lib/services/TeamsService.js';
import {ConnectionsService} from '../src/lib/services/ConnectionsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const OUTPUT_PATH = path.resolve(__dirname, '../src/lib/generated/data.json');
const OUTPUT_DIR = path.dirname(OUTPUT_PATH);

function getAllYamlFiles(dir: string, baseDir = dir): Record<string, string> {
    const result: Record<string, string> = {};
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const p = path.join(dir, file);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            Object.assign(result, getAllYamlFiles(p, baseDir));
        } else if (file.endsWith('.yaml')) {
            const relativePath = path.relative(baseDir, p).replaceAll('\\', '/');
            const content = fs.readFileSync(p, 'utf-8');
            result[relativePath] = content;
        }
    }
    return result;
}

async function compileYamlData() {
    // 1. Load YAML files
    const yamlFiles = getAllYamlFiles(DATA_DIR);
    console.log(`Found ${Object.keys(yamlFiles).length} YAML files in ${DATA_DIR}`);

    // 2. Initialize services
    const groupService = new GroupService(yamlFiles);
    const servicesService = new ServicesService(yamlFiles, groupService);
    const teamsService = new TeamsService(yamlFiles);
    const connectionsService = new ConnectionsService(servicesService);

    // 3. Extract data
    const groups = await groupService.getAllGroups();
    const services = await servicesService.getAllServices();
    const teams = await teamsService.getAllTeams();
    const groupConnections = await connectionsService.getAllGroupConnections(true);

    // 4. Per-group relationships
    const servicesByGroup: Record<string, any> = {};
    const externalServices: Record<string, any> = {};
    for (const groupId of Object.keys(groups)) {
        servicesByGroup[groupId] = await servicesService.getServicesByGroup(groupId);
        externalServices[groupId] = await servicesService.getExternalServicesForGroup(groupId);
    }

    // 5. Aggregate
    const masterData = {
        groups,
        services,
        teams,
        groupConnections,
        servicesByGroup,
        externalServices,
        generatedAt: new Date().toISOString()
    };

    // 6. Write output
    console.log(`Resolved output path: ${OUTPUT_PATH}`);
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, {recursive: true});
    }
    try {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(masterData, null, 2));
        console.log(`Data baked to ${OUTPUT_PATH}`);
    } catch (err) {
        console.error('Failed to write data.json:', err);
    }
}

async function main() {
    await compileYamlData();
}

main().catch(err => {
    console.error('Bake failed:', err);
    process.exit(1);
});

