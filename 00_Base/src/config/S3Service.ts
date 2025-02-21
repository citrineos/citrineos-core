import {S3Client, GetObjectCommand, PutObjectCommand, CreateBucketCommand} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import {SystemConfig} from "./types";

export class S3Service {
    private static instance: S3Client;

    private static getClient(): S3Client {
        if (!this.instance) {
            const isLocal = process.env.AWS_LOCAL === "true";

            const s3Config = {
                region: process.env.AWS_REGION || "us-east-1",
                endpoint: isLocal ? process.env.AWS_S3_ENDPOINT : undefined,
                forcePathStyle: isLocal,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                },
            };

            console.log("S3 Client Config:", JSON.stringify(s3Config, null, 2));
            this.instance = new S3Client(s3Config);
        }
        return this.instance;
    }

    static async fetchConfig(bucket: string, key: string): Promise<SystemConfig | null> {
        try {
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            const { Body } = await this.getClient().send(command);

            if (!Body) return null;

            const configString = await this.streamToString(Body as Readable);
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

    static async saveConfig(bucket: string, key: string, config: SystemConfig, createBucketIfNotExists: boolean = false): Promise<void> {
        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: JSON.stringify(config, null, 2),
                ContentType: "application/json",
            });

            await this.getClient().send(command);
            console.log("Config saved to S3.");
        } catch (error: any) {
            if (createBucketIfNotExists && (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404)) {
                console.warn(`Bucket "${bucket}" not found. Creating it...`);
                await this.createBucket(bucket);
                console.log(`Bucket "${bucket}" created. Retrying config save...`);

                // Retry saving after bucket creation
                await this.saveConfig(bucket, key, config, false);
            } else {
                console.error("Error saving config to S3:", error);
                throw error;
            }
        }
    }

    private static async createBucket(bucket: string): Promise<void> {
        try {
            const command = new CreateBucketCommand({ Bucket: bucket });
            await this.getClient().send(command);
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
