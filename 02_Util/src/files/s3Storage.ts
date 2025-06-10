import {
  CreateBucketCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BootstrapConfig, ConfigStore, SystemConfig } from '@citrineos/base';
import { Readable } from 'stream';
import { ILogObj, Logger } from 'tslog';

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
  async saveFile(fileName: string, content: Buffer, filePath?: string): Promise<string> {
    const bucketName = filePath ? filePath : this.defaultBucketName;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: content,
      ContentType: 'application/octet-stream',
    });
    try {
      const result = await this.s3Client.send(command);

      if (result.$metadata.httpStatusCode !== 200) {
        throw new Error(`Failed to upload file ${fileName}: ${result.$metadata.httpStatusCode}`);
      } else {
        return fileName;
      }
    } catch (error: any) {
      if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
        this._logger.warn(`Bucket "${bucketName}" not found. Creating it...`);
        await this.createBucket(bucketName);
        this._logger.info(`Bucket "${bucketName}" created. Retrying config save...`);
        return await this.saveFile(fileName, content, filePath);
      } else {
        this._logger.error('Error saving config to S3:', error);
        throw error;
      }
    }
  }

  async getFile(id: string, filePath?: string): Promise<string | undefined> {
    const command = new GetObjectCommand({
      Bucket: filePath ? filePath : this.defaultBucketName,
      Key: id,
    });
    const { Body } = await this.s3Client.send(command);

    if (!Body) return;

    return await S3Storage.streamToString(Body as Readable);
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
}
