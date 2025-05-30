// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  BootstrapConfig,
  ConfigStore,
  ConfigStoreFactory,
  defineConfig,
  SystemConfig,
} from '@citrineos/base';
import { LocalStorage, S3Storage, DirectusUtil } from '@citrineos/util';

/**
 * Helper function to create the appropriate ConfigStore based on bootstrap config
 */
function createConfigStore(bootstrapConfig: BootstrapConfig): ConfigStore {
  switch (bootstrapConfig.fileAccess.type) {
    case 'local':
      return new LocalStorage(
        bootstrapConfig.fileAccess.local!.defaultFilePath,
        bootstrapConfig.configFileName,
        bootstrapConfig.configDir,
      );
    case 's3':
      return new S3Storage(
        bootstrapConfig.fileAccess.s3!,
        bootstrapConfig.configFileName,
        bootstrapConfig.configDir,
      );
    case 'directus':
      return new DirectusUtil(
        bootstrapConfig.fileAccess.directus!,
        bootstrapConfig.configFileName,
        bootstrapConfig.configDir,
      );
    default:
      throw new Error(`Unsupported file access type: ${bootstrapConfig.fileAccess.type}`);
  }
}

/**
 * Loads the system configuration
 * 1. Loads bootstrap config from environment variables
 * 2. Uses bootstrap config to create a ConfigStore
 * 3. Loads full config from storage or creates default if none exists
 * 4. Applies environment variable overrides for secrets and other values
 * 5. Validates the final config
 * @param defaultConfig Optional default config to use if no config exists in storage
 * @returns Promise resolving to the validated SystemConfig
 */
export async function loadSystemConfig(
  bootstrapConfig: BootstrapConfig,
  defaultConfig?: SystemConfig,
): Promise<SystemConfig> {
  try {
    const configStore = createConfigStore(bootstrapConfig);
    ConfigStoreFactory.setConfigStore(configStore);
    console.log('Config store initialized');

    let config: SystemConfig | null = await configStore.fetchConfig();

    if (!config) {
      if (!defaultConfig) {
        throw new Error('No configuration found in storage and no default config provided');
      }

      console.warn('No config found in storage. Creating default config...');
      config = defaultConfig;
      await configStore.saveConfig(config);
      console.log('Default config saved to storage');
    } else {
      console.log('Configuration loaded from storage');
    }

    const validatedConfig = defineConfig(config);

    return validatedConfig;
  } catch (error) {
    console.error('Failed to load system configuration:', error);
    throw error;
  }
}
