// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import type { OcpiConfig, OcpiConfigInput } from './ocpi.types.js';
import { ocpiConfigInputSchema, ocpiConfigSchema } from './ocpi.types.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

const args = typeof process !== 'undefined' && process.argv ? process.argv.slice(2) : [];
let dynamicPrefix = 'citrineos_ocpi_';
for (const arg of args) {
  if (arg.startsWith('--env-prefix=')) {
    dynamicPrefix = arg.split('=')[1].toLowerCase();
    break;
  }
}

export const OCPI_ENV_VAR_PREFIX = dynamicPrefix;

/**
 * Finds a case-insensitive match for a key in an object.
 */
function findCaseInsensitiveMatch<T>(
  obj: Record<string, T>,
  targetKey: string,
): string | undefined {
  const lowerTargetKey = targetKey.toLowerCase();
  return Object.keys(obj).find((key) => key.toLowerCase() === lowerTargetKey);
}

/**
 * Gets the Zod schema key map for environment variable mapping
 */
const getZodSchemaKeyMap = (schema: z.ZodType): Record<string, any> => {
  if (
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodDefault
  ) {
    return getZodSchemaKeyMap(schema.unwrap() as z.ZodType);
  }
  if (schema instanceof z.ZodArray) {
    return getZodSchemaKeyMap(schema.element as z.ZodType);
  }
  if (schema instanceof z.ZodObject) {
    const entries = Object.entries(schema.shape) as [string, z.ZodType][];
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
 * Merges OCPI configuration from environment variables into the default configuration
 */
function mergeOcpiConfigFromEnvVars<T extends Record<string, any>>(
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
    if (lowercaseEnvKey.startsWith(OCPI_ENV_VAR_PREFIX)) {
      const envKeyWithoutPrefix = lowercaseEnvKey.substring(OCPI_ENV_VAR_PREFIX.length);
      const path = envKeyWithoutPrefix.split('_');
      let currentConfigPart: Record<string, any> = config;
      let currentConfigKeyMap: Record<string, any> = configKeyMap;
      let validMapping = true;

      for (let i = 0; i < path.length - 1; i++) {
        const part = path[i];
        const matchingKey = findCaseInsensitiveMatch(currentConfigKeyMap, part);
        if (!matchingKey) {
          errors.push(`Invalid environment variable key: ${fullEnvKey} (part: ${part})`);
          validMapping = false;
          break;
        }
        if (!currentConfigPart[matchingKey]) {
          currentConfigPart[matchingKey] = {};
        }
        currentConfigPart = currentConfigPart[matchingKey];
        currentConfigKeyMap = currentConfigKeyMap[matchingKey];
      }

      if (validMapping) {
        const finalPart = path[path.length - 1];
        const finalKey = findCaseInsensitiveMatch(currentConfigKeyMap, finalPart);
        if (finalKey) {
          currentConfigPart[finalKey] = parseEnvValue(value);
        } else {
          errors.push(`Invalid environment variable key: ${fullEnvKey} (final part: ${finalPart})`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.warn('Environment variable mapping errors:', errors);
  }

  return config;
}

/**
 * Parse environment variable value to appropriate type
 */
function parseEnvValue(value: string): any {
  // Handle booleans
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Handle numbers
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // Handle arrays (JSON format)
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // Handle objects (JSON format)
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // Return as string
  return value;
}

/**
 * Define OCPI configuration with environment variable overrides
 */
export function defineOcpiConfig(config: OcpiConfigInput): OcpiConfig {
  const configKeyMap = getZodSchemaKeyMap(ocpiConfigInputSchema);

  // Apply environment variable overrides
  const configWithEnvOverrides = mergeOcpiConfigFromEnvVars(config, process.env, configKeyMap);

  // Validate and return the final configuration
  return ocpiConfigSchema.parse(configWithEnvOverrides);
}

/**
 * Load OCPI configuration from environment or default
 */
export function loadOcpiConfig(
  defaultConfig: OcpiConfigInput,
  logger?: Logger<ILogObj>,
): OcpiConfig {
  try {
    logger?.info('Loading OCPI configuration...');

    // Apply environment variable overrides and validate
    const config = defineOcpiConfig(defaultConfig);

    logger?.info('OCPI configuration loaded successfully');
    return config;
  } catch (error) {
    logger?.error('Failed to load OCPI configuration:', error);
    throw error;
  }
}
