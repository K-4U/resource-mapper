import type {Plugin} from 'vite';
import * as fs from "node:fs";
import * as path from "node:path";
import {config as loadDotenv} from "dotenv";

export function mapperDataPlugin(): Plugin {
    const virtualModuleId = 'virtual:mapper-data';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    return {
        name: 'mapper-data-plugin',
        configResolved(config) {
            loadDotenv({ path: path.resolve(config.root, '.env'), override: false });
        },
        resolveId(id) {
            if (id === virtualModuleId) return resolvedVirtualModuleId;
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                const filePath = process.env.VITE_MAPPER_DATA
                console.log(`Loading mapper data from ${filePath || 'environment variable VITE_MAPPER_DATA not set'}`);
                let data: string;

                if (filePath) {
                    this.addWatchFile(filePath);
                    try {
                        data = fs.readFileSync(filePath, 'utf-8');
                    } catch (err) {
                        console.error(`Failed to read data from ${filePath}: ${err}`);
                        return '{}';
                    }
                }

                return `export default ${data};`;
            }
        }
    };
}
