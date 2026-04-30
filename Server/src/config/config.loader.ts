// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { BootstrapConfig, ConfigStore, SystemConfig } from '@citrineos/base';
import { ConfigStoreFactory, defineConfig, systemConfigInputSchema } from '@citrineos/base';
import { GcpCloudStorage, LocalStorage, S3Storage } from '@citrineos/util';

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
    case 'gcp':
      return new GcpCloudStorage(
        bootstrapConfig.fileAccess.gcp!,
        bootstrapConfig.configFileName,
        bootstrapConfig.configDir!,
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

      // Backfill any optional-with-default fields the input schema defines
      // (e.g. websocketServers[*].protocols added in a later release) so a
      // stored config from an older release auto-heals instead of crashing
      // strict validation in defineConfig.
      //
      // CRITICAL: backfill runs against the on-disk snapshot only — env var
      // overrides are NOT applied here. The persisted config must never carry
      // transient CITRINEOS_* env values; otherwise removing the env on a
      // future boot wouldn't revert the change.
      const inputResult = systemConfigInputSchema.safeParse(config);
      if (inputResult.success) {
        const normalized = inputResult.data as SystemConfig;
        if (!jsonEqual(config, normalized)) {
          try {
            await configStore.saveConfig(normalized);
            console.log('Stored config normalized with schema defaults');
            config = normalized;
          } catch (saveErr) {
            console.warn('Could not persist normalized config to storage:', saveErr);
            // Keep the in-memory normalized form so boot can proceed.
            config = normalized;
          }
        }
      }
    }

    // defineConfig applies env overrides + strict validation for runtime use.
    // Its result is intentionally NOT written back to storage.
    const validatedConfig = defineConfig(config);

    return validatedConfig;
  } catch (error) {
    console.error('Failed to load system configuration:', error);
    throw error;
  }
}

function jsonEqual(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
