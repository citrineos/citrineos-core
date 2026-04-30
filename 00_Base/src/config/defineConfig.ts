// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import type { SystemConfig, SystemConfigInput } from './types.js';
import { systemConfigInputSchema, systemConfigSchema } from './types.js';

const args = typeof process !== 'undefined' && process.argv ? process.argv.slice(2) : [];

let dynamicPrefix = 'citrineos_';
for (const arg of args) {
  if (arg.startsWith('--env-prefix=')) {
    dynamicPrefix = arg.split('=')[1].toLowerCase();
    break;
  }
}

export const CITRINE_ENV_VAR_PREFIX = dynamicPrefix;
export const BOOTSTRAP_CONFIG_ENV_VAR_PREFIX = `bootstrap_${CITRINE_ENV_VAR_PREFIX}`;

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

const getZodSchemaKeyMap = (schema: z.ZodTypeAny): Record<string, any> => {
  if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
    return getZodSchemaKeyMap((schema as z.ZodNullable<any> | z.ZodOptional<any>).unwrap());
  }

  if (schema instanceof z.ZodArray) {
    return getZodSchemaKeyMap(schema.element as z.ZodTypeAny);
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
 * Validates the system configuration.
 *
 * Two-pass:
 *   1. Parse with `systemConfigInputSchema` so any defaults declared on the input
 *      schema (e.g. `websocketServers[*].protocols = ['ocpp2.0.1']`) are filled in.
 *      This lets stored configs that predate a newer optional-with-default field
 *      auto-heal instead of crashing strict validation.
 *   2. Re-parse with the strict `systemConfigSchema` to enforce the final shape.
 *
 * Zod's `z.object()` strips unknown keys by default. Some optional top-level
 * fields (e.g. `oidcClient`) only live on the strict schema, so we must NOT
 * replace `finalConfig` with the parse output — that would silently drop them.
 * Instead the parsed form is used as a defaults-source that the original
 * config is overlaid onto, preserving every original key/leaf and only
 * filling values where the original was missing.
 *
 * If pass 1 fails (truly malformed config), fall back to the strict schema so
 * the original error surface is preserved for genuinely broken configs.
 *
 * @param finalConfig The final system configuration.
 * @throws Error if required properties are not set.
 */
function validateFinalConfig(finalConfig: SystemConfigInput): SystemConfig {
  const inputResult = systemConfigInputSchema.safeParse(finalConfig);
  const withDefaults = inputResult.success
    ? (mergePreservingOriginal(inputResult.data, finalConfig) as SystemConfigInput)
    : finalConfig;
  return systemConfigSchema.parse(withDefaults);
}

/**
 * Merge `original` over `defaults` so the result has every leaf from
 * `original` where defined, falling back to `defaults` only where `original`
 * is missing the key. Unknown keys on `original` are preserved (Zod's
 * default strip would otherwise have removed them). Arrays merge by index;
 * if one side is longer, extra elements come through as-is.
 *
 * Kept inline rather than shared from the Server package so 00_Base has no
 * upward dependencies.
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
  if (
    typeof defaults === 'object' &&
    defaults !== null &&
    !Array.isArray(defaults) &&
    typeof original === 'object' &&
    original !== null &&
    !Array.isArray(original)
  ) {
    const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    for (const key of Object.keys(original as Record<string, unknown>)) {
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
