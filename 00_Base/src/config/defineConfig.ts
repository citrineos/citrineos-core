// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { z } from 'zod';
import { type SystemConfig, SystemConfigInput, systemConfigSchema } from './types';

const args = typeof process !== 'undefined' && process.argv ? process.argv.slice(2) : [];

let dynamicPrefix = 'citrineos_';
for (const arg of args) {
  if (arg.startsWith('--env-prefix=')) {
    dynamicPrefix = arg.split('=')[1].toLowerCase();
    break;
  }
}

export const CITRINE_ENV_VAR_PREFIX = dynamicPrefix;
export const BOOSTRAP_CONFIG_ENV_VAR_PREFIX = `bootstrap_${CITRINE_ENV_VAR_PREFIX}`;

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

const getZodSchemaKeyMap = (schema: z.ZodType): Record<string, any> => {
  if (schema instanceof z.ZodEffects) {
    return getZodSchemaKeyMap(schema._def?.schema);
  }

  if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
    return getZodSchemaKeyMap(schema.unwrap());
  }

  if (schema instanceof z.ZodArray) {
    return getZodSchemaKeyMap(schema.element);
  }

  if (schema instanceof z.ZodObject) {
    const entries = Object.entries<z.ZodType>(schema.shape);

    return entries.reduce(
      (acc, [key, value]) => {
        const nested = getZodSchemaKeyMap(value);

        if (Object.keys(nested).length > 0) {
          acc[key] = nested;
        } else {
          acc[key.toLowerCase()] = key;
        }

        return acc;
      },
      {} as Record<string, any>,
    );
  }

  return {};
};

/**
 * Merges configuration from environment variables into the default configuration. Allows any to keep it as generic as possible.
 * @param defaultConfig The default configuration.
 * @param envVars The environment variables.
 * @returns The merged configuration.
 */
function mergeConfigFromEnvVars<T extends Record<string, any>>(
  defaultConfig: T,
  envVars: NodeJS.ProcessEnv,
  configKeyMap: Record<string, any>,
): T {
  const config: T = { ...defaultConfig };
  const errors: string[] = [];

  for (const [fullEnvKey, value] of Object.entries(envVars)) {
    if (!value) {
      continue;
    }
    const lowercaseEnvKey = fullEnvKey.toLowerCase();
    if (lowercaseEnvKey.startsWith(CITRINE_ENV_VAR_PREFIX)) {
      const envKeyWithoutPrefix = lowercaseEnvKey.substring(CITRINE_ENV_VAR_PREFIX.length);
      const path = envKeyWithoutPrefix.split('_');

      let currentConfigPart: Record<string, any> = config;
      let currentConfigKeyMap: Record<string, any> = configKeyMap;
      let validMapping = true;

      for (let i = 0; i < path.length - 1; i++) {
        const part = path[i];
        const matchingKey = findCaseInsensitiveMatch(currentConfigKeyMap, part);
        if (!matchingKey) {
          errors.push(
            `Environment variable '${fullEnvKey}' refers to unknown configuration segment '${part}'.`,
          );
          validMapping = false;
          break;
        }

        if (currentConfigPart[matchingKey] === undefined) {
          currentConfigPart[matchingKey] = {};
        } else if (
          typeof currentConfigPart[matchingKey] !== 'object' ||
          currentConfigPart[matchingKey] === null
        ) {
          errors.push(
            `Environment variable '${fullEnvKey}' refers to configuration segment '${part}', but its current value is not an object.`,
          );
          validMapping = false;
          break;
        }

        currentConfigPart = currentConfigPart[matchingKey];
        currentConfigKeyMap = currentConfigKeyMap[matchingKey];
      }

      if (!validMapping) {
        continue;
      }

      const finalPart = path[path.length - 1];
      const keyToUse = currentConfigKeyMap[finalPart.toLowerCase()] || finalPart;

      try {
        currentConfigPart[keyToUse] = JSON.parse(value as string);
      } catch {
        console.debug(`Mapping '${value}' as string for environment variable '${fullEnvKey}'.`);
        currentConfigPart[keyToUse] = value;
      }
    }
  }

  errors.forEach((err) => console.error(err));

  return config as T;
}

/**
 * Validates the  system configuration to ensure required properties are set.
 * @param finalConfig The final system configuration.
 * @throws Error if required properties are not set.
 */
function validateFinalConfig(finalConfig: SystemConfigInput): SystemConfig {
  return systemConfigSchema.parse(finalConfig);
}

/**
 * Defines the application configuration by merging input configuration which is defined in a file with environment variables.
 * Takes environment variables over predefined
 * @param inputConfig The file defined input configuration.
 * @returns The final system configuration.
 * @throws Error if required environment variables are not set or if there are parsing errors.
 */
export function defineConfig(inputConfig: SystemConfigInput): SystemConfig {
  const configKeyMap: Record<string, any> = getZodSchemaKeyMap(systemConfigSchema);
  const appConfig = mergeConfigFromEnvVars<SystemConfigInput>(
    inputConfig,
    process.env,
    configKeyMap,
  );

  return validateFinalConfig(appConfig);
}

export const DEFAULT_TENANT_ID = 1;
