import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { run } from './download-aws-icons';

vi.mock('fs');
vi.mock('adm-zip');

describe('download-aws-icons', () => {
    const originalFetch = global.fetch;
    const originalExit = process.exit;
    const originalLog = console.log;
    const originalError = console.error;

    beforeEach(() => {
        vi.resetAllMocks();
        global.fetch = vi.fn();
        // @ts-ignore
        process.exit = vi.fn();
        console.log = vi.fn();
        console.error = vi.fn();
        
        // Default mock for AdmZip
        (AdmZip as any).prototype.extractAllTo = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        process.exit = originalExit;
        console.log = originalLog;
        console.error = originalError;
    });

    it('should skip update if icons are up to date', async () => {
        const lastRun = new Date().toISOString();
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(lastRun);

        await run();

        expect(console.log).toHaveBeenCalledWith('AWS icons are up to date.');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should update if icons are old', async () => {
        const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
        vi.mocked(fs.existsSync).mockImplementation((path) => {
            if (typeof path === 'string' && path.endsWith('.last-updated')) return true;
            return false;
        });
        vi.mocked(fs.readFileSync).mockReturnValue(oldDate);
        
        const mockResponse = {
            ok: true,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        };
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
        vi.mocked(fs.readdirSync).mockReturnValue([] as any);

        await run();

        expect(console.log).toHaveBeenCalledWith('Updating AWS icons...');
        expect(global.fetch).toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle successful download and extraction with flattening', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        const mockResponse = {
            ok: true,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        };
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
        
        // Mock readdirSync for flattening logic
        vi.mocked(fs.readdirSync)
            .mockReturnValueOnce(['root-folder'] as any) // items in TARGET_DIR
            .mockReturnValueOnce(['file1.svg', 'file2.svg'] as any); // items in root-folder

        await run();

        expect(fs.rmSync).toHaveBeenCalled();
        expect(fs.mkdirSync).toHaveBeenCalled();
        expect(fs.renameSync).toHaveBeenCalledTimes(2);
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('AWS icons updated.');
    });

    it('should handle fetch failure', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        const mockResponse = {
            ok: false,
            statusText: 'Not Found'
        };
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

        await run();

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Download failed: Not Found'));
        expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should handle timeout error', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        const abortError = new Error('Timeout');
        abortError.name = 'AbortError';
        vi.mocked(global.fetch).mockRejectedValue(abortError);

        await run();

        expect(console.error).toHaveBeenCalledWith('Failed to update AWS icons: Request timed out');
    });

    it('should handle generic error', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        vi.mocked(global.fetch).mockRejectedValue(new Error('Network Error'));

        await run();

        expect(console.error).toHaveBeenCalledWith('Failed to update AWS icons: Network Error');
    });

    it('should handle unknown error type', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        vi.mocked(global.fetch).mockRejectedValue('Something went wrong');

        await run();

        expect(console.error).toHaveBeenCalledWith('Failed to update AWS icons: Unknown error');
    });
    it('should handle empty ZIP extraction', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        const mockResponse = {
            ok: true,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        };
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
        
        vi.mocked(fs.readdirSync).mockReturnValue([] as any);

        await run();

        expect(console.log).toHaveBeenCalledWith('No icons found in the ZIP.');
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('AWS icons updated.');
    });

    it('should handle more than one item in ZIP extraction (no flattening)', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        const mockResponse = {
            ok: true,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        };
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
        
        vi.mocked(fs.readdirSync).mockReturnValue(['file1.svg', 'file2.svg'] as any);

        await run();

        expect(fs.renameSync).not.toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('AWS icons updated.');
    });
});
