import type {Plugin} from 'vite';
import * as fs from "node:fs";

export function mapperDataPlugin(): Plugin {
    const virtualModuleId = 'virtual:mapper-data';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    return {
        name: 'mapper-data-plugin',
        resolveId(id) {
            if (id === virtualModuleId) return resolvedVirtualModuleId;
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                const filePath = process.env.VITE_MAPPER_DATA
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
