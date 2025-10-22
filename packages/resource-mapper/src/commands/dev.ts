import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { loadConfig, loadServices, loadGroups, loadTeams, ensureDir } from '../utils/loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DevOptions {
  port?: string;
}

export async function dev(options: DevOptions) {
  const cwd = process.cwd();
  console.log('Starting Resource Mapper development server...\n');
  
  try {
    const config = await loadConfig(cwd);
    const servicesDir = path.join(cwd, config.servicesDir || './services');
    const teamsDir = path.join(cwd, config.teamsDir || './teams');
    
    // Load data
    console.log('Loading services and teams...');
    const services = await loadServices(servicesDir);
    const groups = await loadGroups(servicesDir);
    const teams = await loadTeams(teamsDir);
    
    console.log(`Found ${services.size} services in ${groups.size} groups`);
    console.log(`Found ${teams.size} teams\n`);
    
    // Create temp directory for dev server
    const tempDir = path.join(cwd, '.resource-mapper', 'dev');
    await ensureDir(tempDir);
    
    // Copy template files
    const templateDir = path.join(__dirname, '../../templates');
    await copyTemplateFiles(templateDir, tempDir);
    
    // Write data files
    await writeDataFiles(tempDir, services, groups, teams, config);
    
    // Start Nuxt dev server
    const { startDevServer } = await import('./nuxt-dev.js');
    await startDevServer(tempDir, parseInt(options.port || '3000', 10));
    
  } catch (error) {
    console.error('Failed to start development server:', error);
    process.exit(1);
  }
}

async function copyTemplateFiles(templateDir: string, targetDir: string) {
  const { copyDir } = await import('../utils/loader.js');
  await copyDir(templateDir, targetDir);
}

async function writeDataFiles(
  targetDir: string,
  services: Map<string, any>,
  groups: Map<string, any>,
  teams: Map<string, any>,
  config: any
) {
  const dataDir = path.join(targetDir, 'data');
  await ensureDir(dataDir);
  
  await fs.writeFile(
    path.join(dataDir, 'services.json'),
    JSON.stringify(Array.from(services.values()), null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'groups.json'),
    JSON.stringify(Array.from(groups.values()), null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'teams.json'),
    JSON.stringify(Array.from(teams.values()), null, 2)
  );
  
  await fs.writeFile(
    path.join(dataDir, 'config.json'),
    JSON.stringify(config, null, 2)
  );
}
