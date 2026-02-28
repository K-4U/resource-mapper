import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuildCommand } from './build.js';
import { logger } from '../../utils/logger.js';
import * as bakeUtil from '../../utils/bake-util.js';

vi.mock('../../utils/bake-util.js', () => ({
  bakeOrExit: vi.fn(async () => {}),
  getOutputPath: vi.fn(() => '/mock/output.json'),
}));

vi.mock('node:path', async (importOriginal) => {
  const actual: any = await importOriginal();
  return Object.assign({}, actual, {
    resolve: vi.fn(() => '/mock/build'),
  });
});

class TestBuildCommand extends BuildCommand {
  public getTestLauncher() { return this.launcher; }
  public setTestViteProc(proc: any) { this.viteProc = proc; }
  public callSetupCleanup() { this.setupCleanup(); }
  public getTestConfig() { return this.config; }
}

describe('BuildCommand', () => {
  let buildCmd: TestBuildCommand;
  let launchMock: any;
  beforeEach(() => {
    buildCmd = new TestBuildCommand();
    launchMock = vi.fn(() => ({ kill: vi.fn(), on: vi.fn() }));
    buildCmd.getTestLauncher().launch = launchMock;
    vi.clearAllMocks();
  });

  it('logs and runs bake/build logic and calls bakeOrExit, getOutputPath, launcher.launch', async () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const successSpy = vi.spyOn(logger, 'success');
    const bakeSpy = vi.spyOn(bakeUtil, 'bakeOrExit');
    const outSpy = vi.spyOn(bakeUtil, 'getOutputPath');
    await buildCmd.run();
    expect(infoSpy).toHaveBeenCalledWith('Running bake logic...');
    expect(successSpy).toHaveBeenCalledWith('Bake complete. Launching Vite build...');
    expect(bakeSpy).toHaveBeenCalled();
    expect(outSpy).toHaveBeenCalled();
    // Debug output
    // eslint-disable-next-line no-console
    console.log('config.build.outDir:', buildCmd.getTestConfig().build.outDir);
    // eslint-disable-next-line no-console
    console.log('launchMock args:', launchMock.mock.calls[0]);
    expect(launchMock).toHaveBeenCalledWith('build', expect.objectContaining({
      VITE_MAPPER_DATA: '/mock/output.json',
      MAPPER_BUILD_OUT: expect.any(String),
    }));
    infoSpy.mockRestore();
    successSpy.mockRestore();
    bakeSpy.mockRestore();
    outSpy.mockRestore();
  });

  it('sets up cleanup handlers and calls kill/on', () => {
    const killMock = vi.fn();
    const onMock = vi.fn();
    buildCmd.setTestViteProc({ kill: killMock, on: onMock });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    buildCmd.callSetupCleanup();
    // Manually invoke the exit handler registered by setupCleanup
    const exitCall = onMock.mock.calls.find(call => call[0] === 'exit');
    expect(exitCall).toBeDefined();
    const exitHandler = exitCall ? exitCall[1] : undefined;
    expect(exitHandler).toBeInstanceOf(Function);
    expect(() => exitHandler && exitHandler()).toThrow('exit');
    expect(killMock).toHaveBeenCalled();
    expect(onMock).toHaveBeenCalledWith('exit', expect.any(Function));
    exitSpy.mockRestore();
  });
});
