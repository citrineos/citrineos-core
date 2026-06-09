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
import type { BootstrapConfig, ConfigStore, SystemConfig } from '@citrineos/base';
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
    configDir?: string,
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
    this.configBucketName = configDir;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async saveFile(fileId: string, content: Buffer): Promise<string> {
    try {
      await this._putObject(this.defaultBucketName, fileId, content);
      return fileId;
    } catch (error: any) {
      if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
        this._logger.warn(`Bucket "${this.defaultBucketName}" not found. Creating it...`);
        await this.createBucket(this.defaultBucketName);
        this._logger.info(`Bucket "${this.defaultBucketName}" created. Retrying file save...`);
        return this.saveFile(fileId, content);
      }
      this._logger.error('Error saving file to S3:', error);
      throw error;
    }
  }

  async getFile(fileId: string): Promise<string | undefined> {
    return this._getObject(this.defaultBucketName, fileId);
  }

  async exists(fileId: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.defaultBucketName,
      Key: fileId,
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
      this._logger.error(`Error checking existence of "${fileId}" in S3:`, error);
      throw error;
    }
  }

  // S3 has no concept of directories; object keys with "/" separators are
  // implicit, so a key can be written without first creating its prefix.
  // This is intentionally a no-op to satisfy the IFileStorage contract.
  async createDirectory(_fileId: string, _options?: { recursive?: boolean }): Promise<void> {
    return;
  }

  async deleteFile(
    fileId: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void> {
    try {
      if (options?.recursive) {
        await this.deletePrefix(fileId);
      } else {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.defaultBucketName,
            Key: fileId,
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
      this._logger.error(`Error deleting "${fileId}" from S3:`, error);
      throw error;
    }
  }

  async fetchConfig(): Promise<SystemConfig | null> {
    const bucket = this.configBucketName ?? this.defaultBucketName;
    try {
      const configString = await this._getObject(bucket, this.configFileName);
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
    const bucket = this.configBucketName ?? this.defaultBucketName;
    try {
      await this._putObject(
        bucket,
        this.configFileName,
        Buffer.from(JSON.stringify(config, null, 2)),
      );
      this._logger.info('Config saved to S3.');
    } catch (error: any) {
      if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
        this._logger.warn(`Bucket "${bucket}" not found. Creating it...`);
        await this.createBucket(bucket);
        this._logger.info(`Bucket "${bucket}" created. Retrying config save...`);
        return this.saveConfig(config);
      }
      this._logger.error('Error saving config to S3:', error);
      throw error;
    }
  }

  private async _getObject(bucket: string, key: string): Promise<string | undefined> {
    const { Body } = await this.s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!Body) return undefined;
    return S3Storage.streamToString(Body as Readable);
  }

  private async _putObject(bucket: string, key: string, content: Buffer): Promise<void> {
    const result = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentType: 'application/octet-stream',
      }),
    );
    if (result.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to upload file ${key}: ${result.$metadata.httpStatusCode}`);
    }
  }

  private async createBucket(bucket: string): Promise<void> {
    try {
      const command = new CreateBucketCommand({ Bucket: bucket });
      await this.s3Client.send(command);
      this._logger.info(`Bucket "${bucket}" created successfully.`);
    } catch (error) {
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
  private async deletePrefix(prefix: string): Promise<void> {
    let continuationToken: string | undefined;
    do {
      const listed = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.defaultBucketName,
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
            Bucket: this.defaultBucketName,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
          }),
        );
      }

      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);
  }
}
