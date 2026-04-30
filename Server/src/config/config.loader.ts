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
      // CRITICAL constraints:
      //  1. Backfill runs against the on-disk snapshot only — env var
      //     overrides are NOT applied here. The persisted config must never
      //     carry transient CITRINEOS_* env values; otherwise removing the
      //     env on a future boot wouldn't revert the change.
      //  2. systemConfigInputSchema's z.object() strips unknown keys (Zod's
      //     default). Some optional top-level fields like `oidcClient` only
      //     live on the strict schema. We therefore DO NOT replace stored
      //     config with parse output — we use the parse output as a
      //     defaults-source and overlay the original config on top of it,
      //     preserving any keys the input schema doesn't know about.
      const inputResult = systemConfigInputSchema.safeParse(config);
      if (inputResult.success) {
        const normalized = mergePreservingOriginal(inputResult.data, config) as SystemConfig;
        if (!jsonEqual(config, normalized)) {
          try {
            await configStore.saveConfig(normalized);
            console.log('Stored config normalized with schema defaults');
          } catch (saveErr) {
            console.warn('Could not persist normalized config to storage:', saveErr);
          }
          // Use the merged form whether or not the persist succeeded, so boot
          // proceeds even when the storage backend is read-only.
          config = normalized;
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

/**
 * Merge `original` over `defaults` so the result has:
 *  - every leaf from `original` where it is defined
 *  - falling back to `defaults` only where `original` lacks the key
 *  - all unknown keys from `original` preserved (Zod's strip would otherwise
 *    have removed them)
 *
 * Arrays are merged element-wise by index — index N from `original` wins for
 * known fields, index N from `defaults` fills any missing defaulted fields.
 * If one side is longer, extra elements come through as-is.
 */
function mergePreservingOriginal(defaults: unknown, original: unknown): unknown {
  if (original === undefined) {
    return defaults;
  }
  if (defaults === undefined) {
    return original;
  }

  if (Array.isArray(defaults) && Array.isArray(original)) {
    const length = Math.max(defaults.length, original.length);
    const out: unknown[] = [];
    for (let i = 0; i < length; i++) {
      out.push(mergePreservingOriginal(defaults[i], original[i]));
    }
    return out;
  }

  if (isPlainObject(defaults) && isPlainObject(original)) {
    const out: Record<string, unknown> = { ...defaults };
    for (const key of Object.keys(original)) {
      out[key] = mergePreservingOriginal(
        (defaults as Record<string, unknown>)[key],
        (original as Record<string, unknown>)[key],
      );
    }
    return out;
  }

  // Primitive or type mismatch: original wins.
  return original;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
