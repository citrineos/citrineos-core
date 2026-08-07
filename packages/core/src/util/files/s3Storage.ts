// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { BootstrapConfig, ConfigStore } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import { Readable } from 'stream';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class S3Storage implements ConfigStore {
  protected readonly _logger: Logger<ILogObj>;
  private s3Client: S3Client;
  private defaultBucketName: string;
  private configFileName: string;
  private configBucketName: string | undefined;

  constructor(
    config: BootstrapConfig['fileAccess']['s3'],
    configFileName: string,
    configBucket?: string,
    logger?: Logger<ILogObj>,
  ) {
    this.s3Client = new S3Client({
      // Endpoint required for Minio
      ...(config!.endpoint ? { endpoint: config!.endpoint } : {}),
      // Region required for AWS S3
      ...(config!.region ? { region: config!.region } : {}),
      // Only set forcePathStyle to true for Minio, use default (false) for AWS S3
      forcePathStyle: !!config?.s3ForcePathStyle,
      // Add credentials if explicitly provided
      ...(config!.accessKeyId && config!.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config!.accessKeyId,
              secretAccessKey: config!.secretAccessKey,
            },
          }
        : {}),
    });
    this.defaultBucketName = config!.defaultBucketName!;
    this.configFileName = configFileName!;
    this.configBucketName = configBucket;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Uploads content to S3. Creates the bucket on demand if it does not exist.
   * @param key S3 object key.
   * @param content File content as a Buffer.
   * @param bucket Optional bucket override; defaults to `defaultBucketName`.
   *
   * @returns The key used to store the object.
   */
  async saveFile(key: string, content: Buffer, bucket?: string): Promise<string> {
    const bucketName = bucket ?? this.defaultBucketName;
    this._logger.debug(`Saving file to ${bucketName}/${key}`);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: content,
      ContentType: 'application/octet-stream',
    });
    try {
      const result = await this.s3Client.send(command);
      if (result.$metadata.httpStatusCode !== 200) {
        throw new Error(`Failed to upload file ${key}: ${result.$metadata.httpStatusCode}`);
      }
      return key;
    } catch (error: any) {
      if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
        this._logger.warn(`Bucket "${bucketName}" not found. Creating it...`);
        await this.createBucket(bucketName);
        this._logger.info(`Bucket "${bucketName}" created. Retrying file save...`);
        return await this.saveFile(key, content, bucket);
      }
      this._logger.error('Error saving file to S3:', error);
      throw error;
    }
  }

  /**
   * Downloads an S3 object and returns its content as a UTF-8 string.
   * @param key S3 object key.
   * @param bucket Optional bucket override; defaults to `defaultBucketName`.
   *
   * @returns Object content, or undefined if the key does not exist.
   */
  async getFile(key: string, bucket?: string): Promise<string | undefined> {
    const bucketName = bucket ?? this.defaultBucketName;
    this._logger.debug(`Getting file from ${bucketName}/${key}`);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    try {
      const { Body } = await this.s3Client.send(command);
      if (!Body) return;
      return await S3Storage.streamToString(Body as Readable);
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return;
      }
      throw error;
    }
  }

  /**
   * Checks whether an object exists in S3 using a HeadObject request.
   * @param key S3 object key.
   * @param bucket Optional bucket override; defaults to `defaultBucketName`.
   *
   * @returns True if the object exists.
   */
  async exists(key: string, bucket?: string): Promise<boolean> {
    const bucketName = bucket ?? this.defaultBucketName;
    this._logger.debug(`Checking existence of ${bucketName}/${key}`);
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    try {
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.name === 'NoSuchKey' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      this._logger.error(`Error checking existence of "${key}" in S3:`, error);
      throw error;
    }
  }

  /**
   * No-op — S3 has no concept of directories; use "/" separators in keys instead.
   * @param _key Ignored.
   * @param _bucket Ignored.
   * @param _options Ignored.
   */
  async createDirectory(
    _key: string,
    _bucket?: string,
    _options?: { recursive?: boolean },
  ): Promise<void> {
    this._logger.debug(`Creating directory ${_bucket ?? this.defaultBucketName}/${_key}`);
    return;
  }

  /**
   * Deletes an S3 object. With `recursive`, removes all objects whose key starts with the given prefix, paged in batches of 1000.
   * @param key S3 object key or key prefix.
   * @param bucket Optional bucket override; defaults to `defaultBucketName`.
   * @param options Pass `{ recursive: true }` to delete by prefix; `{ force: true }` to suppress not-found errors.
   */
  async deleteFile(
    key: string,
    bucket?: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void> {
    const bucketName = bucket ?? this.defaultBucketName;
    this._logger.debug(`Deleting ${bucketName}/${key}`);
    try {
      if (options?.recursive) {
        await this.deletePrefix(bucketName, key);
      } else {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          }),
        );
      }
    } catch (error: any) {
      const notFound =
        error.name === 'NotFound' ||
        error.name === 'NoSuchKey' ||
        error.$metadata?.httpStatusCode === 404;
      if (notFound && options?.force) {
        return;
      }
      this._logger.error(`Error deleting "${key}" from S3:`, error);
      throw error;
    }
  }

  async fetchConfig(): Promise<SystemConfig | null> {
    try {
      const configString = await this.getFile(this.configFileName, this.configBucketName);
      if (!configString) return null;
      return JSON.parse(configString) as SystemConfig;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        this._logger.warn('Config not found in S3.');
        return null;
      }
      this._logger.error('Error fetching config from S3:', error);
      throw error;
    }
  }

  async saveConfig(config: SystemConfig): Promise<void> {
    await this.saveFile(
      this.configFileName,
      Buffer.from(JSON.stringify(config, null, 2)),
      this.configBucketName,
    );
    this._logger.info('Config saved to S3.');
  }

  private async createBucket(bucket: string): Promise<void> {
    try {
      const command = new CreateBucketCommand({ Bucket: bucket });
      await this.s3Client.send(command);
      this._logger.info(`Bucket "${bucket}" created successfully.`);
    } catch (error: any) {
      if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
        this._logger.debug(`Bucket "${bucket}" already exists.`);
        return;
      }
      this._logger.error(`Failed to create bucket "${bucket}":`, error);
      throw error;
    }
  }

  private static async streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }

  // Deletes every object whose key starts with the given prefix, paging through
  // the listing in batches of up to 1000 (the S3 DeleteObjects limit).
  private async deletePrefix(bucketName: string, prefix: string): Promise<void> {
    let continuationToken: string | undefined;
    do {
      const listed = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const keys = (listed.Contents ?? [])
        .map((obj) => obj.Key)
        .filter((key): key is string => !!key);

      if (keys.length > 0) {
        await this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
          }),
        );
      }

      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);
  }
}
