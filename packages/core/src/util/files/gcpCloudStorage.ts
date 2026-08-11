// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IFileStorage } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import { Bucket, Storage } from '@google-cloud/storage';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class GcpCloudStorage implements IFileStorage {
  protected readonly _logger: Logger<ILogObj>;
  private storageClient: Storage;
  private configBucketName: string;

  constructor(
    config: SystemConfig['fileAccess']['gcp'],
    defaultBucket?: string,
    logger?: Logger<ILogObj>,
  ) {
    if (!config) {
      throw new Error('GCP Cloud Storage config missing.');
    }
    this.storageClient = new Storage({
      projectId: config.projectId,
      credentials: config.credentials,
    });
    this.configBucketName = defaultBucket || config.defaultBucketName;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Uploads content to GCS. Creates the bucket on demand if it does not exist.
   * @param key GCS object name.
   * @param content File content as a Buffer.
   * @param bucket Optional bucket override; defaults to `configBucketName`.
   *
   * @returns The key used to store the object.
   */
  async saveFile(key: string, content: Buffer, bucket?: string): Promise<string> {
    const bucketName = bucket ?? this.configBucketName;
    this._logger.debug(`Saving file to ${bucketName}/${key}`);
    const file = this.getBucket(bucketName).file(key);

    try {
      await file.save(content, {
        contentType: 'application/octet-stream',
        resumable: false,
      });
      return key;
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        this._logger.warn(`Bucket "${bucketName}" not found. Creating it...`);
        await this.createBucket(bucketName);
        this._logger.info(`Bucket "${bucketName}" created. Retrying file save...`);
        return this.saveFile(key, content, bucket);
      }
      this._logger.error('Error saving file to GCP Cloud Storage:', error);
      throw error;
    }
  }

  /**
   * Downloads a GCS object and returns its content as a UTF-8 string.
   * @param key GCS object name.
   * @param bucket Optional bucket override; defaults to `configBucketName`.
   *
   * @returns Object content, or undefined if the key does not exist.
   */
  async getFile(key: string, bucket?: string): Promise<string | undefined> {
    const bucketName = bucket ?? this.configBucketName;
    this._logger.debug(`Getting file from ${bucketName}/${key}`);
    const file = this.getBucket(bucketName).file(key);

    try {
      const [exists] = await file.exists();
      if (!exists) return;

      const [contents] = await file.download();
      return contents.toString('utf-8');
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        // Treat missing file like S3's NoSuchKey
        return;
      }
      this._logger.error('Error reading file from GCP Cloud Storage:', error);
      throw error;
    }
  }

  /**
   * Checks whether an object exists in GCS.
   * @param key GCS object name.
   * @param bucket Optional bucket override; defaults to `configBucketName`.
   *
   * @returns True if the object exists.
   */
  async exists(key: string, bucket?: string): Promise<boolean> {
    const bucketName = bucket ?? this.configBucketName;
    this._logger.debug(`Checking existence of ${bucketName}/${key}`);
    try {
      const [exists] = await this.getBucket(bucketName).file(key).exists();
      return exists;
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      this._logger.error(`Error checking existence of "${key}" in GCP Cloud Storage:`, error);
      throw error;
    }
  }

  /**
   * No-op — GCS has no concept of directories; use "/" separators in keys instead.
   * @param _key Ignored.
   * @param _bucket Ignored.
   * @param _options Ignored.
   */
  async createDirectory(
    _key: string,
    _bucket?: string,
    _options?: { recursive?: boolean },
  ): Promise<void> {
    this._logger.debug(`Creating directory ${_bucket ?? this.configBucketName}/${_key}`);
    return;
  }

  /**
   * Deletes a GCS object. With `recursive`, removes all objects whose name starts with the given prefix.
   * @param key GCS object name or name prefix.
   * @param bucket Optional bucket override; defaults to `configBucketName`.
   * @param options Pass `{ recursive: true }` to delete by prefix; `{ force: true }` to suppress not-found errors.
   */
  async deleteFile(
    key: string,
    bucket?: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void> {
    const bucketName = bucket ?? this.configBucketName;
    this._logger.debug(`Deleting ${bucketName}/${key}`);
    try {
      if (options?.recursive) {
        await this.deletePrefix(bucketName, key);
      } else {
        await this.getBucket(bucketName).file(key).delete();
      }
    } catch (error: any) {
      if (this.isNotFoundError(error) && options?.force) {
        return;
      }
      this._logger.error(`Error deleting "${key}" from GCP Cloud Storage:`, error);
      throw error;
    }
  }

  private getBucket(name: string): Bucket {
    return this.storageClient.bucket(name);
  }

  private async createBucket(bucketName: string): Promise<void> {
    try {
      await this.storageClient.createBucket(bucketName);
      this._logger.info(`Bucket "${bucketName}" created successfully.`);
    } catch (error) {
      this._logger.error(`Failed to create bucket "${bucketName}" in GCP Cloud Storage:`, error);
      throw error;
    }
  }

  private async deletePrefix(bucketName: string, prefix: string): Promise<void> {
    await this.getBucket(bucketName).deleteFiles({ prefix });
  }

  /**
   * Normalize "not found" checks across GCS error shapes.
   */
  private isNotFoundError(error: any): boolean {
    return (
      error?.code === 404 ||
      (typeof error?.message === 'string' &&
        (error.message.includes('No such object') ||
          error.message.includes('Not Found') ||
          error.message.includes('could not find')))
    );
  }
}
