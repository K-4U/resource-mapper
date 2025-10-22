import { spawn } from 'child_process';
import path from 'path';

export async function startDevServer(tempDir: string, port: number): Promise<void> {
  console.log(`Starting Nuxt dev server on port ${port}...`);
  
  return new Promise((resolve, reject) => {
    const nuxtProcess = spawn('npx', ['nuxt', 'dev', '--port', port.toString()], {
      cwd: tempDir,
      stdio: 'inherit',
      shell: true
    });

    nuxtProcess.on('error', (error) => {
      console.error('Failed to start Nuxt dev server:', error);
      reject(error);
    });

    nuxtProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Nuxt dev server exited with code ${code}`);
        process.exit(code || 1);
      }
    });

    // Don't resolve - keep the process running
  });
}
