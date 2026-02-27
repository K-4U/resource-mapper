import { BaseCommand } from '../base.js';
import { logger } from '../../utils/logger.js';
import { bakeOrExit, getDataDir, getOutputPath } from '../../utils/bake-util.js';
import chokidar from 'chokidar';
import path from 'node:path';

export class DevCommand extends BaseCommand {
  protected watcher?: import('chokidar').FSWatcher;
  protected viteProc?: import('node:child_process').ChildProcess;

  protected get name() { return 'dev'; }
  protected get description() { return 'Start the dev server and watch for changes.'; }

  public async run(...args: any[]): Promise<void> {
    logger.info('Running bake logic...');
    await bakeOrExit();
    logger.success('Bake complete. Launching Vite dev server...');

    this.watcher = chokidar.watch(getDataDir(), { ignoreInitial: true }); //Just watch the entire data dir
    this.watcher.on('all', async () => {
      await bakeOrExit(); //This will update the output JSON file, which Vite should pick up and trigger a reload. We don't need to do anything else here.
    });

    this.viteProc = this.launcher.launch('dev', {
      VITE_MAPPER_DATA: getOutputPath(),
      MAPPER_BUILD_OUT: this.config.build.outDir,
    });
    this.setupCleanup();
  }

  protected setupCleanup() {
    const cleanup = () => {
      if (this.watcher) this.watcher.close();
      if (this.viteProc) this.viteProc.kill();
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    if (this.viteProc) this.viteProc.on('exit', cleanup);
  }
}
