import {S3Service, SystemConfig} from "@citrineos/base";
import {createLocalConfig} from "./local";

export async function getOrCreateS3Config(): Promise<SystemConfig> {
    const bucket = process.env.AWS_S3_BUCKET_NAME!;
    const key = process.env.AWS_S3_CONFIG_KEY!;

    try {
        let config = await S3Service.fetchConfig(bucket, key);

        if (!config) {
            console.warn("No config found in S3. Creating default...");
            config = createLocalConfig();
            await S3Service.saveConfig(bucket, key, config, true);
            console.log("Default config pushed to S3.");
        } else {
            console.log("Config fetched from S3.");
        }

        return config;
    } catch (error) {
        console.error("Failed to get or create config:", error);
        throw error;
    }
}
