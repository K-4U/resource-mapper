import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../cli/utils/logger.js';

// --- Module mocks ---
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}));

vi.mock('node:path', async (importOriginal) => {
  const actual: any = await importOriginal();
  return Object.assign({}, actual, {
    resolve: vi.fn((...args: string[]) => args.join('/')),
    join: vi.fn((...args: string[]) => args.join('/')),
    relative: vi.fn((from: string, to: string) => to.replace(from + '/', '')),
    dirname: vi.fn((p: string) => p.replace(/\/[^/]+$/, '')),
  });
});

// vi.hoisted ensures the mock instances are created before module factories run,
// so the same mock instances are accessible both in the factory and in tests.
const mockGroupInstance = vi.hoisted(() => ({
  getAllGroups: vi.fn().mockResolvedValue({ api: { id: 'api' } }),
}));
const mockServicesInstance = vi.hoisted(() => ({
  prepare: vi.fn().mockResolvedValue({ 'api/svc': {} }),
  getServicesByGroup: vi.fn().mockResolvedValue([]),
  getExternalServicesForGroup: vi.fn().mockResolvedValue([]),
}));
const mockTeamsInstance = vi.hoisted(() => ({
  getAllTeams: vi.fn().mockResolvedValue({ 'team-a': { name: 'Team A' } }),
}));
const mockConnectionsInstance = vi.hoisted(() => ({
  getAllGroupConnections: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/GroupService.js', () => ({
  GroupService: vi.fn(function () { return mockGroupInstance; }),
}));

vi.mock('../services/ServicesService.js', () => ({
  ServicesService: vi.fn(function () { return mockServicesInstance; }),
}));

vi.mock('../services/TeamsService.js', () => ({
  TeamsService: vi.fn(function () { return mockTeamsInstance; }),
}));

vi.mock('../services/ConnectionsService.js', () => ({
  ConnectionsService: vi.fn(function () { return mockConnectionsInstance; }),
}));

async function getMocks() {
  const fs = (await import('node:fs')).default;
  const { GroupService } = await import('../services/GroupService.js');
  const { ServicesService } = await import('../services/ServicesService.js');
  const { TeamsService } = await import('../services/TeamsService.js');
  const { ConnectionsService } = await import('../services/ConnectionsService.js');
  return {
    fs,
    GroupService: GroupService as ReturnType<typeof vi.fn>,
    ServicesService: ServicesService as ReturnType<typeof vi.fn>,
    TeamsService: TeamsService as ReturnType<typeof vi.fn>,
    ConnectionsService: ConnectionsService as ReturnType<typeof vi.fn>,
    groupInstance: mockGroupInstance,
    servicesInstance: mockServicesInstance,
    teamsInstance: mockTeamsInstance,
    connectionsInstance: mockConnectionsInstance,
  };
}

describe('bake-logic', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Restore constructor implementations after clearAllMocks wipes them
    const { GroupService } = await import('../services/GroupService.js');
    const { ServicesService } = await import('../services/ServicesService.js');
    const { TeamsService } = await import('../services/TeamsService.js');
    const { ConnectionsService } = await import('../services/ConnectionsService.js');
    (GroupService as ReturnType<typeof vi.fn>).mockImplementation(function () { return mockGroupInstance; });
    (ServicesService as ReturnType<typeof vi.fn>).mockImplementation(function () { return mockServicesInstance; });
    (TeamsService as ReturnType<typeof vi.fn>).mockImplementation(function () { return mockTeamsInstance; });
    (ConnectionsService as ReturnType<typeof vi.fn>).mockImplementation(function () { return mockConnectionsInstance; });
    // Restore instance method return values too
    mockGroupInstance.getAllGroups.mockResolvedValue({ api: { id: 'api' } });
    mockServicesInstance.prepare.mockResolvedValue({ 'api/svc': {} });
    mockServicesInstance.getServicesByGroup.mockResolvedValue([]);
    mockServicesInstance.getExternalServicesForGroup.mockResolvedValue([]);
    mockTeamsInstance.getAllTeams.mockResolvedValue({ 'team-a': { name: 'Team A' } });
    mockConnectionsInstance.getAllGroupConnections.mockResolvedValue([]);
  });

  // ─── getAllYamlFiles (via runBake) ─────────────────────────────────────────

  describe('runBake – file system errors', () => {
    it('throws and logs an error when the data directory does not exist', async () => {
      const { fs } = await getMocks();
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const errorSpy = vi.spyOn(logger, 'error');
      const { runBake } = await import('./bake-logic.js');

      await expect(runBake({ dataDir: '/no/data', outputPath: '/out/data.json' })).rejects.toThrow(
        '[bake-logic] ERROR: Missing ./data directory'
      );
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[bake-logic] ERROR: Missing ./data directory'));
    });
  });

  // ─── runBake – happy path ─────────────────────────────────────────────────

  describe('runBake – happy path', () => {
    function setupHappyFs(fs: any, yamlFiles: Record<string, string> = {}) {
      const fileNames = Object.keys(yamlFiles);
      (fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation((p: string) => {
        // data dir exists, output dir exists
        return true;
      });
      (fs.readdirSync as ReturnType<typeof vi.fn>).mockImplementation((dir: string) => {
        return fileNames.map((f) => f.split('/').pop()!);
      });
      (fs.statSync as ReturnType<typeof vi.fn>).mockReturnValue({ isDirectory: () => false });
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockImplementation((p: string) => {
        const key = Object.keys(yamlFiles).find((k) => p.includes(k.split('/').pop()!));
        return key ? yamlFiles[key] : '';
      });
    }

    it('logs how many YAML files were found', async () => {
      const { fs } = await getMocks();
      setupHappyFs(fs, { 'services/api/svc.yaml': 'id: svc\n' });

      const infoSpy = vi.spyOn(logger, 'info');
      const { runBake } = await import('./bake-logic.js');

      await runBake({ dataDir: '/data', outputPath: '/out/data.json' });

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[bake-logic] Found'));
    });

    it('constructs GroupService, ServicesService, TeamsService and ConnectionsService', async () => {
      const { fs, GroupService, ServicesService, TeamsService, ConnectionsService } = await getMocks();
      setupHappyFs(fs);

      const { runBake } = await import('./bake-logic.js');
      await runBake({ dataDir: '/data', outputPath: '/out/data.json' });

      expect(GroupService).toHaveBeenCalledTimes(1);
      expect(ServicesService).toHaveBeenCalledTimes(1);
      expect(TeamsService).toHaveBeenCalledTimes(1);
      expect(ConnectionsService).toHaveBeenCalledTimes(1);
    });

    it('calls getAllGroups, getAllTeams, servicesService.prepare and getAllGroupConnections', async () => {
      const { fs, groupInstance, servicesInstance, teamsInstance, connectionsInstance } = await getMocks();
      setupHappyFs(fs);

      const { runBake } = await import('./bake-logic.js');
      await runBake({ dataDir: '/data', outputPath: '/out/data.json' });

      expect(groupInstance.getAllGroups).toHaveBeenCalledTimes(1);
      expect(servicesInstance.prepare).toHaveBeenCalledTimes(1);
      expect(teamsInstance.getAllTeams).toHaveBeenCalledTimes(1);
      expect(connectionsInstance.getAllGroupConnections).toHaveBeenCalledWith(true);
    });

    it('calls getServicesByGroup and getExternalServicesForGroup for each group', async () => {
      const { fs, servicesInstance } = await getMocks();
      setupHappyFs(fs);

      // Override the shared group instance to return two groups for this test
      mockGroupInstance.getAllGroups.mockResolvedValueOnce({ api: {}, data: {} });

      const { runBake } = await import('./bake-logic.js');
      await runBake({ dataDir: '/data', outputPath: '/out/data.json' });

      expect(servicesInstance.getServicesByGroup).toHaveBeenCalledWith('api');
      expect(servicesInstance.getServicesByGroup).toHaveBeenCalledWith('data');
      expect(servicesInstance.getExternalServicesForGroup).toHaveBeenCalledWith('api');
      expect(servicesInstance.getExternalServicesForGroup).toHaveBeenCalledWith('data');
    });

    it('writes aggregated JSON to the output path', async () => {
      const { fs } = await getMocks();
      setupHappyFs(fs);

      const { runBake } = await import('./bake-logic.js');
      await runBake({ dataDir: '/data', outputPath: '/out/data.json' });

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/out/data.json',
        expect.stringContaining('"generatedAt"')
      );
    });

    it('logs the resolved output path and success message', async () => {
      const { fs } = await getMocks();
      setupHappyFs(fs);

      const successSpy = vi.spyOn(logger, 'success');
      const { runBake } = await import('./bake-logic.js');

      await runBake({ dataDir: '/data', outputPath: '/out/data.json' });

      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('[bake-logic] Resolved output path'));
      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('[bake-logic] Data baked to'));
    });

    it('creates the output directory if it does not exist', async () => {
      const { fs } = await getMocks();
      (fs.existsSync as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(true)   // DATA_DIR exists
        .mockReturnValueOnce(true)   // statSync / readdirSync
        .mockReturnValueOnce(false); // OUTPUT_DIR does NOT exist
      (fs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (fs.statSync as ReturnType<typeof vi.fn>).mockReturnValue({ isDirectory: () => false });

      const { runBake } = await import('./bake-logic.js');
      await runBake({ dataDir: '/data', outputPath: '/out/data.json' });

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('/out'), { recursive: true });
    });

    it('logs error and rethrows when writeFileSync throws', async () => {
      const { fs } = await getMocks();
      setupHappyFs(fs);
      // Override writeFileSync to throw after setup
      (fs.writeFileSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('disk full');
      });

      const errorSpy = vi.spyOn(logger, 'error');
      const { runBake } = await import('./bake-logic.js');

      await expect(runBake({ dataDir: '/data', outputPath: '/out/data.json' })).rejects.toThrow('disk full');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[bake-logic] Failed to write data.json'));
    });

    it('uses default dataDir from process.cwd() when no opts are provided', async () => {
      const { fs } = await getMocks();
      // data dir does NOT exist → quick path to verify cwd-based dir is used
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const errorSpy = vi.spyOn(logger, 'error');
      const { runBake } = await import('./bake-logic.js');

      await expect(runBake()).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('data'));
    });
  });
});











