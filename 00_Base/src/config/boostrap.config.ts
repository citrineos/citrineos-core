// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { z } from 'zod';
import { CITRINE_ENV_VAR_PREFIX } from './defineConfig';

// Bootstrap schema only contains what's needed to access config storage
export const bootstrapConfigSchema = z.object({
  configFileName: z.string().default('config.json'),
  configDir: z.string().optional(),
  fileAccess: z
    .object({
      type: z.enum(['local', 's3', 'directus']),
      local: z
        .object({
          defaultFilePath: z.string().default('/data'),
        })
        .optional(),
      s3: z
        .object({
          region: z.string().optional(),
          endpoint: z.string().optional(),
          defaultBucketName: z.string().default('citrineos-s3-bucket'),
          s3ForcePathStyle: z.boolean().default(true),
          accessKeyId: z.string().optional(),
          secretAccessKey: z.string().optional(),
        })
        .optional(),
      directus: z
        .object({
          host: z.string().default('localhost'),
          port: z.number().int().positive().default(8055),
          token: z.string().optional(),
          username: z.string().optional(),
          password: z.string().optional(),
          generateFlows: z.boolean().default(false),
        })
        .optional(),
    })
    .refine(
      (obj) => {
        // Ensure the selected type has corresponding config
        switch (obj.type) {
          case 'local':
            return !!obj.local;
          case 's3':
            return !!obj.s3;
          case 'directus':
            return !!obj.directus;
          default:
            return false;
        }
      },
      {
        message: 'Configuration for the selected file access type must be provided',
      },
    ),
});

export type BootstrapConfig = z.infer<typeof bootstrapConfigSchema>;

/**
 * Helper function to load environment variables based on prefix
 */
function getEnvVarValue(key: string): string | undefined {
  const envKey = `${CITRINE_ENV_VAR_PREFIX}${key}`.toUpperCase();
  return process.env[envKey];
}

/**
 * Parse a potentially JSON-formatted environment variable
 */
function parseEnvValue(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Load bootstrap configuration from environment variables
 */
export function loadBootstrapConfig(): BootstrapConfig {
  const config: Record<string, any> = {
    configFileName: getEnvVarValue('config_filename') || 'config.json',
    configDir: getEnvVarValue('config_dir'),
    fileAccess: {
      type: getEnvVarValue('file_access_type') || 'local',
    },
  };

  switch (config.fileAccess.type) {
    case 'local':
      config.fileAccess.local = {
        defaultFilePath: getEnvVarValue('file_access_local_default_file_path') || '/data',
      };
      break;
    case 's3':
      config.fileAccess.s3 = {
        region: getEnvVarValue('file_access_s3_region'),
        endpoint: getEnvVarValue('file_access_s3_endpoint'),
        defaultBucketName:
          getEnvVarValue('file_access_s3_default_bucket_name') || 'citrineos-s3-bucket',
        s3ForcePathStyle: getEnvVarValue('file_access_s3_force_path_style')
          ? parseEnvValue(getEnvVarValue('file_access_s3_force_path_style')!)
          : true,
        accessKeyId: getEnvVarValue('file_access_s3_access_key_id'),
        secretAccessKey: getEnvVarValue('file_access_s3_secret_access_key'),
      };
      break;
    case 'directus':
      config.fileAccess.directus = {
        host: getEnvVarValue('file_access_directus_host'),
        port: getEnvVarValue('file_access_directus_port')
          ? parseInt(getEnvVarValue('file_access_directus_port')!, 10)
          : undefined,
        token: getEnvVarValue('file_access_directus_token'),
        username: getEnvVarValue('file_access_directus_username'),
        password: getEnvVarValue('file_access_directus_password'),
      };
      break;
  }

  try {
    return bootstrapConfigSchema.parse(config);
  } catch (error) {
    console.error('Bootstrap configuration validation failed:', error);
    throw error;
  }
}
