import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger.js';

// --- Module mocks ---
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
  },
}));

vi.mock('node:path', async (importOriginal) => {
  const actual: any = await importOriginal();
  return Object.assign({}, actual, {
    resolve: vi.fn((...args: string[]) => args.join('/')),
    join: vi.fn((...args: string[]) => args.join('/')),
    dirname: vi.fn((p: string) => p.replace(/\/[^/]+$/, '')),
  });
});

vi.mock('../../scripts/bake-logic.js', () => ({
  runBake: vi.fn(),
}));

async function getMocks() {
  const fs = (await import('node:fs')).default;
  const { runBake } = await import('../../scripts/bake-logic.js');
  return { fs, runBake: runBake as ReturnType<typeof vi.fn> };
}

describe('bake-util', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── getDataDir ───────────────────────────────────────────────────────────

  describe('getDataDir', () => {
    it('returns a path ending with /data', async () => {
      const { getDataDir } = await import('./bake-util.js');
      const result = getDataDir();
      expect(result).toMatch(/data$/);
    });
  });

  // ─── getOutputDir ─────────────────────────────────────────────────────────

  describe('getOutputDir', () => {
    it('returns a path ending with /.mapper', async () => {
      const { getOutputDir } = await import('./bake-util.js');
      const result = getOutputDir();
      expect(result).toMatch(/\.mapper$/);
    });
  });

  // ─── getOutputPath ────────────────────────────────────────────────────────

  describe('getOutputPath', () => {
    it('returns a path containing data.json', async () => {
      const { getOutputPath } = await import('./bake-util.js');
      const result = getOutputPath();
      expect(result).toContain('data.json');
    });
  });

  // ─── bakeOrExit ───────────────────────────────────────────────────────────

  describe('bakeOrExit', () => {
    it.each([
      ['dataDir',    (a: any) => a.dataDir,    (v: string) => expect(v).toMatch(/data$/)],
      ['outputPath', (a: any) => a.outputPath, (v: string) => expect(v).toContain('data.json')],
    ])('calls runBake with a correct %s when data directory exists', async (_label, pick, assert) => {
      const { fs, runBake } = await getMocks();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      runBake.mockResolvedValue(undefined);

      const { bakeOrExit } = await import('./bake-util.js');
      await bakeOrExit();

      expect(runBake).toHaveBeenCalledWith(expect.objectContaining({
        dataDir: expect.any(String),
        outputPath: expect.any(String),
      }));
      assert(pick(runBake.mock.calls[0][0]));
    });

    it('logs an error and calls process.exit(1) when data directory is missing', async () => {
      const { fs, runBake } = await getMocks();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const errorSpy = vi.spyOn(logger, 'error');
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

      const { bakeOrExit } = await import('./bake-util.js');
      await expect(bakeOrExit()).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing ./data directory'));
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(runBake).not.toHaveBeenCalled();
    });
  });
});

