import path from 'node:path';
import fs from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidateCommand } from './validate.js';
import { logger } from '../../utils/logger.js';

vi.mock('node:path', () => ({
  default: {
    resolve: vi.fn((...args) => args.join('/'))
  },
  resolve: vi.fn((...args) => args.join('/'))
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    readdirSync: vi.fn(() => ['a.yaml', 'b.yml']),
    readFileSync: vi.fn(() => '{}')
  },
  existsSync: vi.fn(() => true),
  readdirSync: vi.fn(() => ['a.yaml', 'b.yml']),
  readFileSync: vi.fn(() => '{}')
}));

describe('ValidateCommand', () => {
  let validateCmd: ValidateCommand;
  beforeEach(() => {
    validateCmd = new ValidateCommand();
    vi.clearAllMocks();
  });

  it('logs validation steps and finds files, calls path.resolve, fs.existsSync, fs.readdirSync', async () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const successSpy = vi.spyOn(logger, 'success');
    const warnSpy = vi.spyOn(logger, 'warn');
    const errorSpy = vi.spyOn(logger, 'error');
    const resolveSpy = vi.spyOn(path, 'resolve');
    const existsSpy = vi.spyOn(fs, 'existsSync');
    const readdirSpy = vi.spyOn(fs, 'readdirSync');
    await validateCmd.run();
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Starting project validation...'));
    expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration (mapper.config.json) is valid.'));
    expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 data source files.'));
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Build output directory set to:'));
    expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('Validation complete.'));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(resolveSpy).toHaveBeenCalled();
    expect(existsSpy).toHaveBeenCalled();
    expect(readdirSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
    successSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    resolveSpy.mockRestore();
    existsSpy.mockRestore();
    readdirSpy.mockRestore();
  });

  it('logs error if data directory missing and calls process.exit', async () => {
    const errorSpy = vi.spyOn(logger, 'error');
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(validateCmd.run()).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Data directory not found at:'));
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('logs warning if no yaml files found', async () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue([]);
    await validateCmd.run();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Data directory is empty. No YAML files found to process.'));
    warnSpy.mockRestore();
  });
});
