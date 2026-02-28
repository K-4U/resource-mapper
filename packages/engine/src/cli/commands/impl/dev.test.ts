import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevCommand } from './dev.js';
import { logger } from '../../utils/logger.js';
import * as bakeUtil from '../../utils/bake-util.js';
import chokidar from 'chokidar';

vi.mock('../../utils/bake-util.js', () => ({
  bakeOrExit: vi.fn(async () => {}),
  getDataDir: vi.fn(() => '/mock/data'),
  getOutputPath: vi.fn(() => '/mock/output.json'),
}));

vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn(() => ({ on: vi.fn(), close: vi.fn() }))
  },
  watch: vi.fn(() => ({ on: vi.fn(), close: vi.fn() }))
}));

class TestDevCommand extends DevCommand {
  public getTestLauncher() { return this.launcher; }
  public setTestViteProc(proc: any) { this.viteProc = proc; }
  public setTestWatcher(watcher: any) { this.watcher = watcher; }
  public callSetupCleanup() { this.setupCleanup(); }
  public getConfigForTest() { return this.config; }
}

describe('DevCommand', () => {
  let devCmd: TestDevCommand;
  let launchMock: any;
  let watcherMock: any;
  beforeEach(() => {
    devCmd = new TestDevCommand();
    launchMock = vi.fn(() => ({ kill: vi.fn(), on: vi.fn() }));
    watcherMock = { on: vi.fn(), close: vi.fn() };
    devCmd.getTestLauncher().launch = launchMock;
    vi.spyOn(chokidar, 'watch').mockReturnValue(watcherMock);
    vi.clearAllMocks();
  });

  it('logs and runs bake/dev logic and calls bakeOrExit, getDataDir, getOutputPath, launcher.launch, watcher.on', async () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const successSpy = vi.spyOn(logger, 'success');
    const bakeSpy = vi.spyOn(bakeUtil, 'bakeOrExit');
    const dataDirSpy = vi.spyOn(bakeUtil, 'getDataDir');
    const outSpy = vi.spyOn(bakeUtil, 'getOutputPath');
    await devCmd.run();
    expect(infoSpy).toHaveBeenCalledWith('Running bake logic...');
    expect(successSpy).toHaveBeenCalledWith('Bake complete. Launching Vite dev server...');
    expect(bakeSpy).toHaveBeenCalled();
    expect(dataDirSpy).toHaveBeenCalled();
    expect(outSpy).toHaveBeenCalled();
    expect(launchMock).toHaveBeenCalledWith('dev', {
      VITE_MAPPER_DATA: '/mock/output.json',
      MAPPER_BUILD_OUT: devCmd.getConfigForTest().build.outDir,
    });
    expect(watcherMock.on).toHaveBeenCalledWith('all', expect.any(Function));
    infoSpy.mockRestore();
    successSpy.mockRestore();
    bakeSpy.mockRestore();
    dataDirSpy.mockRestore();
    outSpy.mockRestore();
  });

  it('sets up cleanup handlers and calls watcher.close, viteProc.kill, viteProc.on', () => {
    const killMock = vi.fn();
    const onMock = vi.fn();
    const closeMock = vi.fn();
    devCmd.setTestViteProc({ kill: killMock, on: onMock });
    devCmd.setTestWatcher({ close: closeMock, on: vi.fn() });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    devCmd.callSetupCleanup();
    // Simulate SIGINT to trigger cleanup
    process.emit('SIGINT');
    expect(exitSpy).toHaveBeenCalled();
    expect(closeMock).toHaveBeenCalled();
    expect(killMock).toHaveBeenCalled();
    expect(onMock).toHaveBeenCalledWith('exit', expect.any(Function));
    exitSpy.mockRestore();
  });
});
