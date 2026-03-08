import { execa } from 'execa';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { logger } from './logger.js';

const require = createRequire(import.meta.url);

export class ViteLauncher {

  private resolveTemplateRoot(): string {
    try {
      // Finds the @k-4u/resource-mapper-core package regardless of where it's installed
      const corePkgPath = require.resolve('@k-4u/resource-mapper-core/package.json');
      return path.dirname(corePkgPath);
    } catch (e) {
      logger.error('Could not find @k-4u/resource-mapper-core. Is it installed?');
      process.exit(1);
    }
  }

  /**
   * Resolves the Vite binary path by looking up the package location
   * or falling back to a PATH-based execution.
   */
  private findViteBin(): string {
    try {
      // 1. Try to find the vite package through Node's resolution
      const vitePackagePath = require.resolve('vite/package.json');
      const binDir = path.join(path.dirname(vitePackagePath), '..', '.bin');
      const fullPath = path.join(binDir, 'vite');

      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    } catch (e) {
      // Package resolution failed, which can happen in some monorepo links
    }

    // 2. Fallback: Check local node_modules manually
    const localBin = path.join(process.cwd(), 'node_modules', '.bin', 'vite');
    if (fs.existsSync(localBin)) {
      return localBin;
    }

    // 3. Final Fallback: Trust the shell to find it in the PATH
    return 'vite';
  }

  /**
   * Spawns the Vite process using execa with the provided configuration and environment.
   */
  public launch(command: 'dev' | 'build', env: Record<string, string>, outDir?: string): any {
    const viteBin = this.findViteBin();
    const templateRoot = this.resolveTemplateRoot();

    logger.info(`Launching vite with command: ${command}`);

    const args: string[] = [
      command,
    ];

    if (command === 'build' && outDir) {
      args.push('--outDir', path.resolve(process.cwd(), outDir), '--emptyOutDir');
    }

    logger.info(`Running vite with args: ${args.join(' ')}`);

    // preferLocal: true ensures it looks in node_modules/.bin even if findViteBin returns just 'vite'
    const child = execa(viteBin, args, {
      stdio: 'inherit',
      cwd: templateRoot,
      env: {
        ...process.env,
        ...env
      },
      preferLocal: true,
      windowsHide: false
    });

    // Handle errors via the promise-based catch, but still support the event-style contract
    child.catch((err) => {
      // Ignore SIGINT (Ctrl+C) as it's a normal exit via the terminal
      if (err.signal !== 'SIGINT') {
        logger.error(`Vite process failed: ${err.message}`);
        process.exit(1);
      }
    });

    return child;
  }
}