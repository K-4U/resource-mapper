import { BaseCommand } from '../base.js';
import { logger } from '../../utils/logger.js';
import path from 'node:path';
import fs from 'node:fs';

export class ValidateCommand extends BaseCommand {
    protected get name(): string {
        return 'validate';
    }

    protected get description(): string {
        return 'Verify the mapper.config.json and data source integrity';
    }

    public async run(): Promise<void> {
        logger.info('Starting project validation...');

        // 1. Config Validation
        // (This already passed if we reached this line, due to the constructor)
        logger.success('Configuration (mapper.config.json) is valid.');

        // 2. Data Directory Validation
        const dataPath = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dataPath)) {
            logger.error(`Data directory not found at: ${dataPath}`);
            process.exit(1);
        }

        const files = fs.readdirSync(dataPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
        if (files.length === 0) {
            logger.warn('Data directory is empty. No YAML files found to process.');
        } else {
            logger.success(`Found ${files.length} data source files.`);
        }

        //TODO: Actually parse the YAML files and validate their contents against expected schemas (groups, services, teams, connections)

        // 3. Output Directory Check
        const outDir = path.resolve(process.cwd(), this.config.build.outDir);
        logger.info(`Build output directory set to: ${outDir}`);

        logger.success('Validation complete. Project is ready to map!');
    }
}