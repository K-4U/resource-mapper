import { Command } from 'commander';
import { generate } from './commands/generate.js';
import { dev } from './commands/dev.js';
import { build } from './commands/build.js';

export async function run() {
  const program = new Command();

  program
    .name('resource-mapper')
    .description('Generate documentation for your service architecture')
    .version('0.1.0');

  program
    .command('dev')
    .description('Start the development server')
    .option('-p, --port <port>', 'Port to run the dev server on', '3000')
    .action(dev);

  program
    .command('generate')
    .description('Generate static site from YAML files')
    .option('-o, --output <dir>', 'Output directory for generated files', './dist')
    .action(generate);

  program
    .command('build')
    .description('Build the static site for production')
    .option('-o, --output <dir>', 'Output directory for built files', './dist')
    .action(build);

  await program.parseAsync(process.argv);
}
