import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ViteLauncher } from './vite-launcher.js';
import { logger } from './logger.js';

// --- Module mocks ---
vi.mock('execa', () => ({
  default: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
  },
}));

vi.mock('node:path', async (importOriginal) => {
  const actual: any = await importOriginal();
  return Object.assign({}, actual, {
    resolve: vi.fn((...args: string[]) => args.join('/')),
    dirname: vi.fn((p: string) => p.replace(/\/[^/]+$/, '')),
    join: vi.fn((...args: string[]) => args.join('/')),
  });
});

// A single shared mock require object — createRequire always returns THIS same instance,
// so both the module-under-test and the tests share the exact same req.resolve mock.
// vi.hoisted ensures mockReq is initialized before vi.mock factories run.
const mockReq = vi.hoisted(() => {
  const req: any = vi.fn();
  req.resolve = vi.fn();
  return req;
});

vi.mock('node:module', () => ({
  createRequire: vi.fn(() => mockReq),
}));

// Helper: get mocked modules
async function getMocks() {
  const execa = (await import('execa')).default as unknown as ReturnType<typeof vi.fn>;
  const fs = (await import('node:fs')).default;
  return { execa, fs, req: mockReq };
}

// Helper: configure req.resolve for the "happy path" where everything resolves
async function setupHappyPath() {
  const { fs } = await getMocks();
  mockReq.resolve.mockImplementation((id: string) => {
    if (id === '@resource-mapper/core/package.json') return '/mock/core/package.json';
    if (id === 'vite/package.json') return '/mock/node_modules/vite/package.json';
    throw new Error('not found');
  });
  (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
}

describe('ViteLauncher', () => {
  let launcher: ViteLauncher;
  let childMock: any;
  let catchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    launcher = new ViteLauncher();
    catchMock = vi.fn();
    childMock = { catch: catchMock };
    const { execa } = await getMocks();
    execa.mockReturnValue(childMock);
    catchMock.mockReturnValue(undefined);
    // Default: happy path so tests that don't override don't break
    await setupHappyPath();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── resolveTemplateRoot ──────────────────────────────────────────────────

  describe('resolveTemplateRoot (via launch)', () => {
    it('resolves @resource-mapper/core package path and passes its dirname as cwd to execa', async () => {
      const { execa } = await getMocks();

      const result = launcher.launch('dev', {});

      expect(result).toBe(childMock);
      const callArgs = (execa as any).mock.calls[0];
      // cwd should be the dirname of the resolved core package path
      expect(callArgs[2].cwd).toBe('/mock/core');
    });

    it('calls logger.error and process.exit(1) when @resource-mapper/core cannot be resolved', async () => {
      const { fs } = await getMocks();
      // Override: core resolution throws
      mockReq.resolve.mockImplementation(() => { throw new Error('not installed'); });
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const errorSpy = vi.spyOn(logger, 'error');
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

      expect(() => launcher.launch('dev', {})).toThrow('process.exit');
      expect(errorSpy).toHaveBeenCalledWith('Could not find @resource-mapper/core. Is it installed?');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  // ─── findViteBin ─────────────────────────────────────────────────────────

  describe('findViteBin (via launch)', () => {
    it('uses the vite bin resolved via require.resolve when the path exists', async () => {
      const { fs, execa } = await getMocks();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

      launcher.launch('dev', {});

      const viteBinArg = (execa as any).mock.calls[0][0] as string;
      expect(viteBinArg).toContain('vite');
      expect(fs.existsSync).toHaveBeenCalled();
    });

    it('falls back to local node_modules/.bin/vite when resolved vite path does not exist but local bin does', async () => {
      const { fs, execa } = await getMocks();
      (fs.existsSync as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(false)   // resolved vite bin → not found
        .mockReturnValueOnce(true);   // local node_modules/.bin/vite → found

      launcher.launch('dev', {});

      const viteBinArg = (execa as any).mock.calls[0][0] as string;
      expect(viteBinArg).toContain('node_modules');
      expect(viteBinArg).toContain('vite');
    });

    it('falls back to plain "vite" string when neither resolved nor local bin exists', async () => {
      const { fs, execa } = await getMocks();
      // vite/package.json resolution throws → no resolved path
      mockReq.resolve.mockImplementation((id: string) => {
        if (id === '@resource-mapper/core/package.json') return '/mock/core/package.json';
        throw new Error('not found');
      });
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      launcher.launch('dev', {});

      const viteBinArg = (execa as any).mock.calls[0][0] as string;
      expect(viteBinArg).toBe('vite');
    });
  });

  // ─── launch ──────────────────────────────────────────────────────────────

  describe('launch', () => {
    it('logs info messages for dev command', () => {
      const infoSpy = vi.spyOn(logger, 'info');
      launcher.launch('dev', {});
      expect(infoSpy).toHaveBeenCalledWith('Launching vite with command: dev');
      expect(infoSpy).toHaveBeenCalledWith('Running vite with args: dev');
    });

    it('calls execa with correct options for dev command', async () => {
      const { execa } = await getMocks();
      launcher.launch('dev', { MY_VAR: 'hello' });
      expect(execa).toHaveBeenCalledWith(
        expect.any(String),
        ['dev'],
        expect.objectContaining({
          stdio: 'inherit',
          preferLocal: true,
          windowsHide: false,
          env: expect.objectContaining({ MY_VAR: 'hello' }),
        })
      );
    });

    it('passes only ["dev"] as args and does not include --outDir', async () => {
      const { execa } = await getMocks();
      launcher.launch('dev', {});
      const argsUsed = (execa as any).mock.calls[0][1] as string[];
      expect(argsUsed).toEqual(['dev']);
      expect(argsUsed).not.toContain('--outDir');
    });

    it('calls execa with build + --outDir + --emptyOutDir when outDir is provided', async () => {
      const { execa } = await getMocks();
      launcher.launch('build', { SOME: 'var' }, 'dist');
      const argsUsed = (execa as any).mock.calls[0][1] as string[];
      expect(argsUsed[0]).toBe('build');
      expect(argsUsed).toContain('--outDir');
      expect(argsUsed).toContain('--emptyOutDir');
    });

    it('logs build args including --outDir and --emptyOutDir', () => {
      const infoSpy = vi.spyOn(logger, 'info');
      launcher.launch('build', {}, 'dist');
      expect(infoSpy).toHaveBeenCalledWith('Launching vite with command: build');
      const argsLog = infoSpy.mock.calls.find(c => (c[0] as string).startsWith('Running vite with args:'));
      expect(argsLog).toBeDefined();
      expect(argsLog![0]).toContain('--outDir');
      expect(argsLog![0]).toContain('--emptyOutDir');
    });

    it('calls execa with only ["build"] when outDir is not provided', async () => {
      const { execa } = await getMocks();
      launcher.launch('build', {});
      const argsUsed = (execa as any).mock.calls[0][1] as string[];
      expect(argsUsed).toEqual(['build']);
      expect(argsUsed).not.toContain('--outDir');
    });

    it('returns the child process returned by execa', () => {
      const result = launcher.launch('dev', {});
      expect(result).toBe(childMock);
    });

    it('merges process.env with provided env when calling execa', async () => {
      const { execa } = await getMocks();
      const originalEnv = process.env;
      process.env = { EXISTING: 'env-var' };
      launcher.launch('dev', { CUSTOM: 'value' });
      const callEnv = (execa as any).mock.calls[0][2].env;
      expect(callEnv).toMatchObject({ EXISTING: 'env-var', CUSTOM: 'value' });
      process.env = originalEnv;
    });

    it('attaches a catch handler to the child process', async () => {
      const { execa } = await getMocks();
      const localCatch = vi.fn().mockReturnValue(undefined);
      const localChild = { catch: localCatch };
      execa.mockReturnValue(localChild);

      launcher.launch('dev', {});

      expect(localCatch).toHaveBeenCalledWith(expect.any(Function));
    });

    it('suppresses SIGINT errors in the catch handler without calling logger.error', async () => {
      const { execa } = await getMocks();
      let catchHandler: ((err: any) => void) | undefined;
      childMock = { catch: vi.fn((fn) => { catchHandler = fn; return undefined; }) };
      execa.mockReturnValue(childMock);

      const errorSpy = vi.spyOn(logger, 'error');
      launcher.launch('dev', {});

      expect(catchHandler).toBeDefined();
      catchHandler!({ signal: 'SIGINT', message: 'killed' });
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('calls logger.error and process.exit(1) for non-SIGINT errors in catch handler', async () => {
      const { execa } = await getMocks();
      let catchHandler: ((err: any) => void) | undefined;
      childMock = { catch: vi.fn((fn) => { catchHandler = fn; return undefined; }) };
      execa.mockReturnValue(childMock);

      const errorSpy = vi.spyOn(logger, 'error');
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

      launcher.launch('dev', {});
      expect(catchHandler).toBeDefined();
      expect(() => catchHandler!({ signal: 'SIGTERM', message: 'something went wrong' })).toThrow('process.exit');
      expect(errorSpy).toHaveBeenCalledWith('Vite process failed: something went wrong');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});


