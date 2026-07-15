// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { SystemConfig } from '@citrineos/base';
import { Readable } from 'stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { S3Storage } from '@util/index.js';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn((params) => params),
  GetObjectCommand: vi.fn((params) => params),
  HeadObjectCommand: vi.fn((params) => params),
  DeleteObjectCommand: vi.fn((params) => params),
  DeleteObjectsCommand: vi.fn((params) => params),
  ListObjectsV2Command: vi.fn((params) => params),
  CreateBucketCommand: vi.fn((params) => params),
}));

const createReadableStream = (content: string): Readable => Readable.from([Buffer.from(content)]);

describe('S3Storage', () => {
  let s3Storage: S3Storage;

  const mockConfig = {
    endpoint: 'http://localhost:9000',
    defaultBucketName: 'test-bucket',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret',
    s3ForcePathStyle: true,
  };

  const mockSystemConfig: SystemConfig = {
    modules: {},
    util: {},
  } as SystemConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    s3Storage = new S3Storage(mockConfig, 'config.json', 'config-bucket');
  });

  describe('saveFile', () => {
    const key = 'test-file.txt';
    const content = Buffer.from('test content');

    it('should upload the file and return the key', async () => {
      mockSend.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });

      const result = await s3Storage.saveFile(key, content);

      expect(result).toBe(key);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: 'test-bucket', Key: key }),
      );
    });

    it('should use custom bucket if provided', async () => {
      mockSend.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });

      await s3Storage.saveFile(key, content, 'custom-bucket');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ Bucket: 'custom-bucket' }));
    });

    it('should create bucket and retry on NoSuchBucket error', async () => {
      const bucketError = { name: 'NoSuchBucket' };
      mockSend
        .mockRejectedValueOnce(bucketError)
        .mockResolvedValueOnce(undefined) // createBucket
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } }); // retry

      const result = await s3Storage.saveFile(key, content);

      expect(result).toBe(key);
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should throw if upload returns a non-200 status', async () => {
      mockSend.mockResolvedValue({ $metadata: { httpStatusCode: 500 } });

      await expect(s3Storage.saveFile(key, content)).rejects.toThrow(
        `Failed to upload file ${key}`,
      );
    });

    it('should rethrow non-bucket errors', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      await expect(s3Storage.saveFile(key, content)).rejects.toThrow('Network error');
    });
  });

  describe('getFile', () => {
    const key = 'test-file.txt';

    it('should return file content as a UTF-8 string', async () => {
      mockSend.mockResolvedValue({ Body: createReadableStream('hello world') });

      const result = await s3Storage.getFile(key);

      expect(result).toBe('hello world');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: 'test-bucket', Key: key }),
      );
    });

    it('should use custom bucket if provided', async () => {
      mockSend.mockResolvedValue({ Body: createReadableStream('data') });

      await s3Storage.getFile(key, 'custom-bucket');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ Bucket: 'custom-bucket' }));
    });

    it('should return undefined if the key does not exist (NoSuchKey)', async () => {
      mockSend.mockRejectedValue({ name: 'NoSuchKey' });

      const result = await s3Storage.getFile(key);

      expect(result).toBeUndefined();
    });

    it('should return undefined if Body is empty', async () => {
      mockSend.mockResolvedValue({ Body: null });

      const result = await s3Storage.getFile(key);

      expect(result).toBeUndefined();
    });

    it('should rethrow non-404 errors', async () => {
      mockSend.mockRejectedValue(new Error('Access denied'));

      await expect(s3Storage.getFile(key)).rejects.toThrow('Access denied');
    });
  });

  describe('exists', () => {
    const key = 'test-file.txt';

    it('should return true if the object exists', async () => {
      mockSend.mockResolvedValue({});

      const result = await s3Storage.exists(key);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: 'test-bucket', Key: key }),
      );
    });

    it('should use custom bucket if provided', async () => {
      mockSend.mockResolvedValue({});

      await s3Storage.exists(key, 'custom-bucket');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ Bucket: 'custom-bucket' }));
    });

    it('should return false on NotFound error', async () => {
      mockSend.mockRejectedValue({ name: 'NotFound' });

      const result = await s3Storage.exists(key);

      expect(result).toBe(false);
    });

    it('should return false on NoSuchKey error', async () => {
      mockSend.mockRejectedValue({ name: 'NoSuchKey' });

      const result = await s3Storage.exists(key);

      expect(result).toBe(false);
    });

    it('should rethrow non-404 errors', async () => {
      mockSend.mockRejectedValue(new Error('Access denied'));

      await expect(s3Storage.exists(key)).rejects.toThrow('Access denied');
    });
  });

  describe('createDirectory', () => {
    it('should be a no-op and not send any S3 request', async () => {
      await s3Storage.createDirectory('some/path');

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    const key = 'test-file.txt';

    it('should delete a single object', async () => {
      mockSend.mockResolvedValue({});

      await s3Storage.deleteFile(key);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: 'test-bucket', Key: key }),
      );
    });

    it('should use custom bucket if provided', async () => {
      mockSend.mockResolvedValue({});

      await s3Storage.deleteFile(key, 'custom-bucket');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ Bucket: 'custom-bucket' }));
    });

    it('should delete all objects by prefix when recursive is true', async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [{ Key: 'prefix/a.txt' }, { Key: 'prefix/b.txt' }],
          IsTruncated: false,
        })
        .mockResolvedValueOnce({});

      await s3Storage.deleteFile('prefix/', undefined, { recursive: true });

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Delete: { Objects: [{ Key: 'prefix/a.txt' }, { Key: 'prefix/b.txt' }] },
        }),
      );
    });

    it('should suppress not-found errors when force is true', async () => {
      mockSend.mockRejectedValue({ name: 'NoSuchKey' });

      await expect(s3Storage.deleteFile(key, undefined, { force: true })).resolves.toBeUndefined();
    });

    it('should rethrow not-found errors when force is false', async () => {
      const error = { name: 'NoSuchKey' };
      mockSend.mockRejectedValue(error);

      await expect(s3Storage.deleteFile(key)).rejects.toEqual(error);
    });
  });

  describe('fetchConfig', () => {
    it('should fetch and parse config successfully', async () => {
      mockSend.mockResolvedValue({ Body: createReadableStream(JSON.stringify(mockSystemConfig)) });

      const result = await s3Storage.fetchConfig();

      expect(result).toEqual(mockSystemConfig);
    });

    it('should return null if config does not exist', async () => {
      mockSend.mockRejectedValue({ name: 'NoSuchKey' });

      const result = await s3Storage.fetchConfig();

      expect(result).toBeNull();
    });

    it('should rethrow non-404 errors', async () => {
      mockSend.mockRejectedValue(new Error('Access denied'));

      await expect(s3Storage.fetchConfig()).rejects.toThrow('Access denied');
    });
  });

  describe('saveConfig', () => {
    it('should serialize and upload config as JSON', async () => {
      mockSend.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });

      await s3Storage.saveConfig(mockSystemConfig);

      const expectedBody = Buffer.from(JSON.stringify(mockSystemConfig, null, 2));
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Body: expectedBody,
          Key: 'config.json',
          Bucket: 'config-bucket',
        }),
      );
    });
  });
});
