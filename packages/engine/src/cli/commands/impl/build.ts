import {BaseCommand} from '../base.js';
import {logger} from '../../utils/logger.js';
import {bakeOrExit, getOutputPath} from '../../utils/bake-util.js';

export class BuildCommand extends BaseCommand {
  protected viteProc?: import('node:child_process').ChildProcess;

  protected get name() { return 'build'; }
  protected get description() { return 'Bake data and build the project.'; }

  public async run(...args: any[]): Promise<void> {
    logger.info('Running bake logic...');
    await bakeOrExit();
    logger.success('Bake complete. Launching Vite build...');

    this.viteProc = this.launcher.launch('build', {
      VITE_MAPPER_DATA: getOutputPath(),
      MAPPER_BUILD_OUT: this.config.build.outDir,
    });
    this.setupCleanup();
  }

  protected setupCleanup() {
    const cleanup = (code?: number) => {
      if (this.viteProc) this.viteProc.kill();
      process.exit(code ?? 0);
    };
    process.on('SIGINT', () => cleanup());
    process.on('SIGTERM', () => cleanup());
    if (this.viteProc) this.viteProc.on('exit', cleanup);
  }
}
