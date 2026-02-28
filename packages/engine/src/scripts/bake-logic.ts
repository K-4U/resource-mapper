import fs from 'node:fs';
import path from 'node:path';
import { GroupService } from '../services/GroupService.js';
import { ServicesService } from '../services/ServicesService.js';
import { TeamsService } from '../services/TeamsService.js';
import { ConnectionsService } from '../services/ConnectionsService.js';
import {logger} from "../cli/utils/logger.js";

function getAllYamlFiles(dir: string, baseDir = dir): Record<string, string> {
    const result: Record<string, string> = {};
    if (!fs.existsSync(dir)) return result;
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const p = path.join(dir, file);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            Object.assign(result, getAllYamlFiles(p, baseDir));
        } else if (file.endsWith('.yaml')) {
            const relativePath = path.relative(baseDir, p).replaceAll('\\', '/');
            result[relativePath] = fs.readFileSync(p, 'utf-8');
        }
    }
    return result;
}

export async function runBake(opts?: { dataDir?: string; outputPath?: string }) {
    // Dynamic pathing
    const DATA_DIR = opts?.dataDir || path.resolve(process.cwd(), 'data');
    const OUTPUT_PATH = opts?.outputPath || path.resolve(process.cwd(), '.mapper/data.json');
    const OUTPUT_DIR = path.dirname(OUTPUT_PATH);

    if (!fs.existsSync(DATA_DIR)) {
        logger.error(`[bake-logic] ERROR: Missing ./data directory at ${DATA_DIR}`);
        throw new Error(`[bake-logic] ERROR: Missing ./data directory at ${DATA_DIR}`);
    }

    // 1. Load YAML files
    const yamlFiles = getAllYamlFiles(DATA_DIR);
    logger.info(`[bake-logic] Found ${Object.keys(yamlFiles).length} YAML files in ${DATA_DIR}`);

    // 2. Initialize services
    const groupService = new GroupService(yamlFiles);
    const servicesService = new ServicesService(yamlFiles, groupService);
    const teamsService = new TeamsService(yamlFiles);
    const connectionsService = new ConnectionsService(servicesService);

    // 3. Extract data - run prepares in parallel where possible
    const groupsPromise = groupService.getAllGroups();
    const teamsPromise = teamsService.getAllTeams();
    const servicesPreparePromise = servicesService.prepare();
    const groupConnectionsPromise = connectionsService.getAllGroupConnections(true);

    const [groups, teams, servicesAll, groupConnections] = await Promise.all([
        groupsPromise,
        teamsPromise,
        servicesPreparePromise,
        groupConnectionsPromise
    ]);

    // 4. Per-group relationships - fetch services per group in parallel
    const servicesByGroup: Record<string, any> = {};
    const externalServices: Record<string, any> = {};
    const groupIds = Object.keys(groups);
    await Promise.all(groupIds.map(async (groupId) => {
        servicesByGroup[groupId] = await servicesService.getServicesByGroup(groupId);
        externalServices[groupId] = await servicesService.getExternalServicesForGroup(groupId);
    }));

    // 5. Aggregate
    const masterData = {
        groups,
        services: servicesAll,
        teams,
        groupConnections,
        servicesByGroup,
        externalServices,
        generatedAt: new Date().toISOString()
    };

    // 6. Write output
    logger.success(`[bake-logic] Resolved output path: ${OUTPUT_PATH}`);
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, {recursive: true});
    }
    try {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(masterData, null, 2));
        logger.success(`[bake-logic] Data baked to ${OUTPUT_PATH}`);
    } catch (err) {
        logger.error(`[bake-logic] Failed to write data.json: ${err}`);
        throw err;
    }
}
