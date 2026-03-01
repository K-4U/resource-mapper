import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Integration test: real zod, only fs is mocked ---
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

vi.mock('node:path', async (importOriginal) => {
  const actual: any = await importOriginal();
  return Object.assign({}, actual, {
    resolve: vi.fn((...args: string[]) => args.join('/')),
  });
});

async function getFs() {
  return (await import('node:fs')).default;
}

describe('config-mapper (integration – real zod)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── MapperConfigSchema ───────────────────────────────────────────────────

  describe('MapperConfigSchema', () => {
    it.each([
      ['build.outDir',    (r: any) => r.build.outDir,    'dist'              ],
      ['site.title',      (r: any) => r.site.title,      'Resource Mapper'   ],
      ['site.subtitle',   (r: any) => r.site.subtitle,   'Architecture Atlas'],
    ])('applies default value for %s when parsing an empty object', async (_label, pick, expected) => {
      const { MapperConfigSchema } = await import('./config-mapper.js');
      expect(pick(MapperConfigSchema.parse({}))).toBe(expected);
    });

    it('accepts and returns custom build.outDir', async () => {
      const { MapperConfigSchema } = await import('./config-mapper.js');
      const result = MapperConfigSchema.parse({ build: { outDir: 'custom-out' } });
      expect(result.build.outDir).toBe('custom-out');
    });

    it('accepts and returns custom site title and subtitle', async () => {
      const { MapperConfigSchema } = await import('./config-mapper.js');
      const result = MapperConfigSchema.parse({
        site: { title: 'My Atlas', subtitle: 'A great tool' },
      });
      expect(result.site.title).toBe('My Atlas');
      expect(result.site.subtitle).toBe('A great tool');
    });

    it('accepts and returns an optional logo', async () => {
      const { MapperConfigSchema } = await import('./config-mapper.js');
      const result = MapperConfigSchema.parse({ site: { logo: '/logo.png' } });
      expect(result.site.logo).toBe('/logo.png');
    });

    it('logo is undefined when not provided', async () => {
      const { MapperConfigSchema } = await import('./config-mapper.js');
      expect(MapperConfigSchema.parse({}).site.logo).toBeUndefined();
    });

    it.each([
      ['an invalid outDir type',  { build: { outDir: 42 } }],
    ])('throws a ZodError for %s', async (_label, input) => {
      const { MapperConfigSchema } = await import('./config-mapper.js');
      expect(() => MapperConfigSchema.parse(input)).toThrow();
    });
  });

  // ─── getMapperConfig ──────────────────────────────────────────────────────

  describe('getMapperConfig', () => {
    it('returns defaults when mapper.config.json does not exist', async () => {
      const fs = await getFs();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const { getMapperConfig } = await import('./config-mapper.js');
      const config = getMapperConfig();

      expect(config.build.outDir).toBe('dist');
      expect(config.site.title).toBe('Resource Mapper');
    });

    it('does not call readFileSync when the config file does not exist', async () => {
      const fs = await getFs();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const { getMapperConfig } = await import('./config-mapper.js');
      getMapperConfig();

      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('reads and parses mapper.config.json when it exists', async () => {
      const fs = await getFs();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify({ build: { outDir: 'my-out' } })
      );

      const { getMapperConfig } = await import('./config-mapper.js');
      const config = getMapperConfig();

      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('mapper.config.json'), 'utf-8');
      expect(config.build.outDir).toBe('my-out');
    });

    it('merges partial config with defaults (site stays default when not provided)', async () => {
      const fs = await getFs();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify({ build: { outDir: 'output' } })
      );

      const { getMapperConfig } = await import('./config-mapper.js');
      const config = getMapperConfig();

      expect(config.build.outDir).toBe('output');
      expect(config.site.title).toBe('Resource Mapper');
      expect(config.site.subtitle).toBe('Architecture Atlas');
    });

    it('returns a full custom config when all fields are provided', async () => {
      const fs = await getFs();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify({
          build: { outDir: 'build-out' },
          site: { title: 'Custom Title', subtitle: 'Custom Sub', logo: '/img/logo.svg' },
        })
      );

      const { getMapperConfig } = await import('./config-mapper.js');
      const config = getMapperConfig();

      expect(config.build.outDir).toBe('build-out');
      expect(config.site.title).toBe('Custom Title');
      expect(config.site.subtitle).toBe('Custom Sub');
      expect(config.site.logo).toBe('/img/logo.svg');
    });

    it.each([
      ['invalid JSON',    'not json {{{'],
      ['wrong field type', JSON.stringify({ build: { outDir: 123 } })],
    ])('throws when config file contains %s', async (_label, fileContent) => {
      const fs = await getFs();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(fileContent);

      const { getMapperConfig } = await import('./config-mapper.js');
      expect(() => getMapperConfig()).toThrow();
    });
  });
});

