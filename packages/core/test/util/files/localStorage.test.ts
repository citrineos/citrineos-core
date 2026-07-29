// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';
import type { SystemConfig } from '@citrineos/base';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorage } from '@util/index.js';

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    rmSync: vi.fn(),
  },
}));

describe('LocalStorage', () => {
  const defaultRoot = 'uploads';
  let storage: LocalStorage;

  const mockSystemConfig: SystemConfig = {
    modules: {},
    util: {},
  } as SystemConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new LocalStorage(defaultRoot, 'config.json', 'config-dir');
  });

  const resolvedPath = (key: string, bucket?: string) =>
    path.resolve(process.cwd(), bucket ?? defaultRoot, key);

  describe('saveFile', () => {
    const key = 'test-file.txt';
    const content = Buffer.from('test content');

    it('should write content to the resolved path', async () => {
      const result = await storage.saveFile(key, content);

      expect(result).toBe(key);
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(resolvedPath(key)), {
        recursive: true,
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(resolvedPath(key), content, 'utf-8');
    });

    it('should use custom bucket as the directory when provided', async () => {
      await storage.saveFile(key, content, 'custom-dir');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        resolvedPath(key, 'custom-dir'),
        content,
        'utf-8',
      );
    });

    it('should reject an absolute key by default', async () => {
      await expect(storage.saveFile('/absolute/path/file.txt', content)).rejects.toThrow(
        /absolute paths are not allowed/,
      );
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should use an absolute key as-is when trusted', async () => {
      const absoluteKey = '/absolute/path/file.txt';

      await storage.saveFile(absoluteKey, content, undefined, { trusted: true });

      expect(fs.writeFileSync).toHaveBeenCalledWith(absoluteKey, content, 'utf-8');
    });
  });

  describe('getFile', () => {
    const key = 'test-file.txt';

    it('should return file content as a UTF-8 string', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('file content' as any);

      const result = await storage.getFile(key);

      expect(result).toBe('file content');
      expect(fs.readFileSync).toHaveBeenCalledWith(resolvedPath(key), 'utf-8');
    });

    it('should use custom bucket as the directory when provided', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('data' as any);

      await storage.getFile(key, 'custom-dir');

      expect(fs.readFileSync).toHaveBeenCalledWith(resolvedPath(key, 'custom-dir'), 'utf-8');
    });

    it('should return undefined if the path does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await storage.getFile(key);

      expect(result).toBeUndefined();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should reject an absolute key by default', async () => {
      await expect(storage.getFile('/absolute/path/file.txt')).rejects.toThrow(
        /absolute paths are not allowed/,
      );
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should use an absolute key as-is when trusted', async () => {
      const absoluteKey = '/absolute/path/file.txt';
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('content' as any);

      await storage.getFile(absoluteKey, undefined, { trusted: true });

      expect(fs.readFileSync).toHaveBeenCalledWith(absoluteKey, 'utf-8');
    });
  });

  describe('exists', () => {
    const key = 'test-file.txt';

    it('should return true if the path exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await storage.exists(key);

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(resolvedPath(key));
    });

    it('should return false if the path does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await storage.exists(key);

      expect(result).toBe(false);
    });

    it('should use custom bucket as the directory when provided', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await storage.exists(key, 'custom-dir');

      expect(fs.existsSync).toHaveBeenCalledWith(resolvedPath(key, 'custom-dir'));
    });
  });

  describe('createDirectory', () => {
    const key = 'new-dir';

    it('should create a directory at the resolved path', async () => {
      await storage.createDirectory(key);

      expect(fs.mkdirSync).toHaveBeenCalledWith(resolvedPath(key), { recursive: undefined });
    });

    it('should pass options to mkdirSync', async () => {
      await storage.createDirectory(key, undefined, { recursive: true });

      expect(fs.mkdirSync).toHaveBeenCalledWith(resolvedPath(key), { recursive: true });
    });

    it('should use custom bucket as the directory when provided', async () => {
      await storage.createDirectory(key, 'custom-dir');

      expect(fs.mkdirSync).toHaveBeenCalledWith(resolvedPath(key, 'custom-dir'), {
        recursive: undefined,
      });
    });
  });

  describe('deleteFile', () => {
    const key = 'test-file.txt';

    it('should delete the file at the resolved path', async () => {
      await storage.deleteFile(key);

      expect(fs.rmSync).toHaveBeenCalledWith(resolvedPath(key), {
        recursive: undefined,
        force: undefined,
      });
    });

    it('should pass options to rmSync', async () => {
      await storage.deleteFile(key, undefined, { recursive: true, force: true });

      expect(fs.rmSync).toHaveBeenCalledWith(resolvedPath(key), { recursive: true, force: true });
    });

    it('should use custom bucket as the directory when provided', async () => {
      await storage.deleteFile(key, 'custom-dir');

      expect(fs.rmSync).toHaveBeenCalledWith(resolvedPath(key, 'custom-dir'), {
        recursive: undefined,
        force: undefined,
      });
    });
  });

  describe('path validation (default, untrusted)', () => {
    const content = Buffer.from('x');

    it.each(['../../../tmp/x', 'a/../../b', 'foo/..', '..', '..\\..\\x'])(
      'rejects parent-directory traversal %j',
      async (key) => {
        await expect(storage.saveFile(key, content)).rejects.toThrow(/traversal/);
        expect(fs.writeFileSync).not.toHaveBeenCalled();
      },
    );

    it.each(['/tmp/x', 'C:\\Windows\\Temp', 'c:/windows/temp', '\\\\host\\share'])(
      'rejects absolute path %j',
      async (key) => {
        await expect(storage.saveFile(key, content)).rejects.toThrow(
          /absolute paths are not allowed/,
        );
        expect(fs.writeFileSync).not.toHaveBeenCalled();
      },
    );

    it('rejects a key containing a NUL byte', async () => {
      await expect(storage.saveFile('certs/leaf\0.pem', content)).rejects.toThrow(/NUL byte/);
    });

    it.each(['certs', 'sub/dir/file.pem', 'tenant_1/leaf'])(
      'accepts contained relative key %j',
      async (key) => {
        await storage.saveFile(key, content);
        expect(fs.writeFileSync).toHaveBeenCalledWith(resolvedPath(key), content, 'utf-8');
      },
    );

    it('allows traversal/absolute when trusted', async () => {
      await expect(
        storage.saveFile('../../escapes/x.pem', content, undefined, { trusted: true }),
      ).resolves.toBeDefined();
      await expect(
        storage.saveFile('/absolute/x.pem', content, undefined, { trusted: true }),
      ).resolves.toBeDefined();
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchConfig', () => {
    it('should return parsed SystemConfig', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSystemConfig) as any);

      const result = await storage.fetchConfig();

      expect(result).toEqual(mockSystemConfig);
    });

    it('should return null if config file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await storage.fetchConfig();

      expect(result).toBeNull();
    });

    it('should return null on read error', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('disk error');
      });

      const result = await storage.fetchConfig();

      expect(result).toBeNull();
    });
  });

  describe('saveConfig', () => {
    it('should write serialized config to the config file', async () => {
      await storage.saveConfig(mockSystemConfig);

      const expectedContent = Buffer.from(JSON.stringify(mockSystemConfig, null, 2));
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(process.cwd(), 'config-dir', 'config.json'),
        expectedContent,
        'utf-8',
      );
    });
  });
});
