import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { loadConfig, loadServices, loadGroups, loadTeams, ensureDir, copyDir } from '../utils/loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GenerateOptions {
  output?: string;
}

export async function generate(options: GenerateOptions) {
  const cwd = process.cwd();
  console.log('Generating static site...\n');
  
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
    
    // Create temp directory for generation
    const tempDir = path.join(cwd, '.resource-mapper', 'temp');
    await ensureDir(tempDir);
    
    // Copy template files
    console.log('Copying template files...');
    const templateDir = path.join(__dirname, '../../templates');
    await copyDir(templateDir, tempDir);
    
    // Write data files
    console.log('Writing data files...');
    await writeDataFiles(tempDir, services, groups, teams, config);
    
    // Install dependencies in temp directory
    console.log('Installing dependencies...');
    await installDependencies(tempDir);
    
    // Generate static site using Nuxt
    console.log('Generating static site with Nuxt...');
    const outputDir = options.output || './dist';
    await generateStaticSite(tempDir, outputDir);
    
    console.log('\n✓ Static site generated successfully!');
    console.log(`Output directory: ${path.resolve(cwd, outputDir)}`);
    
  } catch (error) {
    console.error('Failed to generate static site:', error);
    process.exit(1);
  }
}

async function writeDataFiles(
  targetDir: string,
  services: Map<string, any>,
  groups: Map<string, any>,
  teams: Map<string, any>,
  config: any
) {
  // Write to public/data so it's included in static build
  const dataDir = path.join(targetDir, 'public', 'data');
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

async function installDependencies(tempDir: string) {
  const { execSync } = await import('child_process');
  
  try {
    execSync('npm install', {
      cwd: tempDir,
      stdio: 'inherit'
    });
  } catch (error) {
    throw new Error('Failed to install dependencies in temp directory');
  }
}

async function generateStaticSite(tempDir: string, outputDir: string) {
  const { execSync } = await import('child_process');
  
  const absoluteOutputDir = path.resolve(outputDir);
  
  // Run nuxt generate with proper output configuration
  execSync('npx nuxt generate', {
    cwd: tempDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NITRO_OUTPUT_DIR: absoluteOutputDir
    }
  });
  
  // Nuxt generates to .output/public by default, copy it to our output dir
  const nuxtOutputDir = path.join(tempDir, '.output', 'public');
  await copyDir(nuxtOutputDir, absoluteOutputDir);
}
