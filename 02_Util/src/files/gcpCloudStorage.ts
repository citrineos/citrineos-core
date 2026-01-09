// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, ConfigStore, SystemConfig } from '@citrineos/base';
import { Bucket, Storage } from '@google-cloud/storage';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class GcpCloudStorage implements ConfigStore {
  protected readonly _logger: Logger<ILogObj>;
  private storageClient: Storage;
  private configBucketName: string;
  private configFileName: string;

  constructor(
    config: BootstrapConfig['fileAccess']['gcp'],
    configFileName: string,
    configDir?: string,
    logger?: Logger<ILogObj>,
  ) {
    if (!config) {
      throw new Error('GCP Cloud Storage config missing.');
    }
    this.storageClient = new Storage({
      projectId: config.projectId,
      credentials: config.credentials,
    });
    this.configBucketName = configDir || 'default';
    this.configFileName = configFileName;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Save a raw file buffer into GCS.
   *
   * @param fileName - Object key / blob name.
   * @param content  - File data.
   * @param filePath - Optional bucket name, falls back to configBucketName.
   */
  async saveFile(fileName: string, content: Buffer, filePath?: string): Promise<string> {
    const bucketName = filePath ? filePath : this.configBucketName;
    const bucket = this.getBucket(bucketName);
    const file = bucket.file(fileName);

    try {
      await file.save(content, {
        contentType: 'application/octet-stream',
        resumable: false,
      });
      return fileName;
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        this._logger.warn(`Bucket "${bucketName}" not found. Creating it...`);
        await this.createBucket(bucketName);
        this._logger.info(`Bucket "${bucketName}" created. Retrying file save...`);
        return this.saveFile(fileName, content, filePath);
      }

      this._logger.error('Error saving file to GCP Cloud Storage:', error);
      throw error;
    }
  }

  /**
   * Read a file from GCS and return its contents as UTF-8 string.
   *
   * @param id       - Object key / blob name.
   * @param filePath - Optional bucket name, falls back to configBucketName.
   */
  async getFile(id: string, filePath?: string): Promise<string | undefined> {
    const bucketName = filePath ? filePath : this.configBucketName;
    const bucket = this.getBucket(bucketName);
    const file = bucket.file(id);

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
   * Load JSON config from GCS and parse as SystemConfig.
   */
  async fetchConfig(): Promise<SystemConfig | null> {
    try {
      const configString = await this.getFile(this.configFileName, this.configBucketName);
      if (!configString) return null;
      return JSON.parse(configString) as SystemConfig;
    } catch (error: any) {
      if (this.isNotFoundError(error)) {
        this._logger.warn('Config not found in GCP Cloud Storage.');
        return null;
      }
      this._logger.error('Error fetching config from GCP Cloud Storage:', error);
      throw error;
    }
  }

  /**
   * Serialize and save SystemConfig JSON to GCS.
   */
  async saveConfig(config: SystemConfig): Promise<void> {
    await this.saveFile(
      this.configFileName,
      Buffer.from(JSON.stringify(config, null, 2)),
      this.configBucketName,
    );
    this._logger.info('Config saved to GCP Cloud Storage.');
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
