// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  type SystemConfig,
  SystemConfigInput,
  systemConfigSchema,
} from './types';

/**
 * Finds a case-insensitive match for a key in an object.
 * @param obj The object to search.
 * @param targetKey The target key.
 * @returns The matching key or undefined.
 */
function findCaseInsensitiveMatch<T>(
  obj: Record<string, T>,
  targetKey: string,
): string | undefined {
  const lowerTargetKey = targetKey.toLowerCase();
  return Object.keys(obj).find((key) => key.toLowerCase() === lowerTargetKey);
}

/**
 * Merges configuration from environment variables into the default configuration. Allows any to keep it as generic as possible.
 * @param defaultConfig The default configuration.
 * @param envVars The environment variables.
 * @returns The merged configuration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeConfigFromEnvVars<T extends Record<string, any>>(
  defaultConfig: T,
  envVars: NodeJS.ProcessEnv,
): T {
  const config: T = { ...defaultConfig };

  const prefix = 'citrineos_';

  for (const [fullEnvKey, value] of Object.entries(envVars)) {
    if (!value) {
      continue;
    }
    const lowercaseEnvKey = fullEnvKey.toLowerCase();
    console.log(lowercaseEnvKey);
    if (lowercaseEnvKey.startsWith(prefix)) {
      const envKeyWithoutPrefix = lowercaseEnvKey.substring(prefix.length);
      const path = envKeyWithoutPrefix.split('_');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let currentConfigPart: any = config;

      for (let i = 0; i < path.length - 1; i++) {
        const part = path[i];
        const matchingKey = findCaseInsensitiveMatch(currentConfigPart, part);
        if (matchingKey && typeof currentConfigPart[matchingKey] === 'object') {
          currentConfigPart = currentConfigPart[matchingKey];
        } else {
          currentConfigPart[part] = {};
          currentConfigPart = currentConfigPart[part];
        }
      }

      const finalPart = path[path.length - 1];
      const keyToUse =
          findCaseInsensitiveMatch(currentConfigPart, finalPart) || finalPart;

      try {
        currentConfigPart[keyToUse] = JSON.parse(value as string);
      } catch {
        console.error(
          `Error parsing value '${value}' for environment variable '${fullEnvKey}'.`,
        );
        currentConfigPart[keyToUse] = value;
      }
    }
  }
  return config as T;
}

/**
 * Validates the  system configuration to ensure required properties are set.
 * @param finalConfig The final system configuration.
 * @throws Error if required properties are not set.
 */
function validateFinalConfig(finalConfig: SystemConfigInput) {
  if (!finalConfig.data.sequelize.username) {
    throw new Error(
      'CITRINEOS_DATA_SEQUELIZE_USERNAME must be set if username not provided in config',
    );
  }
  if (!finalConfig.data.sequelize.password) {
    throw new Error(
      'CITRINEOS_DATA_SEQUELIZE_PASSWORD must be set if password not provided in config',
    );
  }
}

/**
 * Defines the application configuration by merging input configuration which is defined in a file with environment variables.
 * Takes environment variables over predefined
 * @param inputConfig The file defined input configuration.
 * @returns The final system configuration.
 * @throws Error if required environment variables are not set or if there are parsing errors.
 */
export function defineConfig(inputConfig: SystemConfigInput): SystemConfig {
  const appConfig = mergeConfigFromEnvVars<SystemConfigInput>(
    inputConfig,
    process.env,
  );

  validateFinalConfig(appConfig);

  return systemConfigSchema.parse(appConfig);
}
