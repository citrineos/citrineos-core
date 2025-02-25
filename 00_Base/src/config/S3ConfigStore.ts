import {SystemConfig} from "./types";
import {ConfigStore} from "./ConfigStore";
import {CreateBucketCommand, GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {Readable} from "stream";

interface S3ConfigStoreOptions {
  endpoint: string;
  bucketName: string;
  keyName: string;
}

export class S3ConfigStore implements ConfigStore {
  private s3Client: S3Client;
  private bucketName: string;
  private keyName: string;

  constructor(config: SystemConfig['util']['configStorage']['s3']) {
    this.s3Client = new S3Client({
      endpoint: config!.endpoint,
      forcePathStyle: true,
    });
    this.bucketName = config!.bucketName!;
    this.keyName = config!.keyName!;
  }

  async fetchConfig(): Promise<SystemConfig | null> {
    try {
      const command = new GetObjectCommand({ Bucket: this.bucketName, Key: this.keyName });
      const { Body } = await this.s3Client.send(command);

      if (!Body) return null;

      const configString = await S3ConfigStore.streamToString(Body as Readable);
      console.log("Config fetched from S3.");
      return JSON.parse(configString) as SystemConfig;
    } catch (error: any) {
      if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
        console.warn("Config not found in S3.");
        return null;
      }
      console.error("Error fetching config from S3:", error);
      throw error;
    }
  }

  async saveConfig(config: SystemConfig): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: this.keyName,
        Body: JSON.stringify(config, null, 2),
        ContentType: "application/json",
      });

      await this.s3Client.send(command);
      console.log("Config saved to S3.");
    } catch (error: any) {
      if (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
        console.warn(`Bucket "${this.bucketName}" not found. Creating it...`);
        await this.createBucket(this.bucketName);
        console.log(`Bucket "${this.bucketName}" created. Retrying config save...`);
        await this.saveConfig(config);
      } else {
        console.error("Error saving config to S3:", error);
        throw error;
      }
    }
  }

  private async createBucket(bucket: string): Promise<void> {
    try {
      const command = new CreateBucketCommand({ Bucket: bucket });
      await this.s3Client.send(command);
      console.log(`Bucket "${bucket}" created successfully.`);
    } catch (error) {
      console.error(`Failed to create bucket "${bucket}":`, error);
      throw error;
    }
  }

  private static async streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      stream.on("error", reject);
    });
  }
}
