// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  configSchema,
  type SystemConfig,
  type SystemConfigInput,
  type WebsocketServerConfig,
  websocketServersConfigSchema,
} from '@citrineos/types';
import { z } from 'zod';
import type { IFileStorage } from '../interfaces/files/fileStorage.js';

const args = typeof process !== 'undefined' && process.argv ? process.argv.slice(2) : [];

let dynamicPrefix = 'citrineos_';
for (const arg of args) {
  if (arg.startsWith('--env-prefix=')) {
    dynamicPrefix = arg.split('=')[1].toLowerCase();
    break;
  }
}

const CITRINE_ENV_VAR_PREFIX = dynamicPrefix;

/**
 * Prefixed variables that are deliberately not part of the config schema — runtime
 * feature flags read straight from `process.env`. Listed here so the loader does not
 * report them as misconfiguration. Compared without the prefix, case-insensitively.
 */
const NON_CONFIG_ENV_VARS = new Set(['use_drizzle']);

/** One resolved path segment: the real schema key, and the level below it if any. */
type KeyMapMatch = { key: string; child?: Record<string, any> };

export class ConfigLoader {
  private static websocketServers: WebsocketServerConfig[] | undefined;

  public static async loadConfig(): Promise<SystemConfig> {
    const configFromEnv = this.mergeConfigFromEnvVars({}, process.env);
    return configSchema.parse(configFromEnv);
  }

  /**
   * Reads and validates the websocket servers this pod hosts, or returns the already
   * read config. The returned array is shared with every other caller — see
   * {@link websocketServers}.
   *
   * @param fileStorage Storage the file is read through; keys resolve against its root.
   * @param fileName `SystemConfig.websocketServerConfigFile`.
   * @throws If the file is missing or fails schema validation.
   */
  public static async loadWebsocketServersConfig(
    fileStorage: IFileStorage,
    fileName: string,
  ): Promise<WebsocketServerConfig[]> {
    if (!this.websocketServers) {
      const configString = await fileStorage.getFile(fileName);
      if (!configString) {
        throw new Error(`Websocket servers config file not found: ${fileName}`);
      }
      this.websocketServers = websocketServersConfigSchema.parse(JSON.parse(configString));
    }
    return this.websocketServers;
  }

  /**
   * Validates and writes the websocket servers config back to storage, then brings the
   * shared array up to date.
   *
   * @throws If `websocketServers` fails schema validation. Nothing is written or updated
   *   in that case.
   */
  public static async saveWebsocketServersConfig(
    fileStorage: IFileStorage,
    fileName: string,
    websocketServers: WebsocketServerConfig[],
  ): Promise<void> {
    const validated = websocketServersConfigSchema.parse(websocketServers);
    await fileStorage.saveFile(fileName, Buffer.from(JSON.stringify(validated)));
    if (this.websocketServers) {
      // In place, not reassigned: consumers hold the array itself, so replacing it here
      // would leave them on the previous one.
      this.websocketServers.splice(0, this.websocketServers.length, ...validated);
    } else {
      this.websocketServers = validated;
    }
  }

  /**
   * Merges configuration from environment variables into the default configuration. Allows any to keep it as generic as possible.
   * @param config The default configuration.
   * @param envVars The environment variables.
   * @returns The merged configuration.
   */
  private static mergeConfigFromEnvVars(
    config: SystemConfigInput,
    envVars: NodeJS.ProcessEnv,
  ): SystemConfigInput {
    const configKeyMap = this.getZodSchemaKeyMap(configSchema);
    const errors: string[] = [];

    for (const [fullEnvKey, value] of Object.entries(envVars)) {
      if (!value) {
        continue;
      }
      const lowercaseEnvKey = fullEnvKey.toLowerCase();
      if (lowercaseEnvKey.startsWith(CITRINE_ENV_VAR_PREFIX)) {
        const envKeyWithoutPrefix = lowercaseEnvKey.substring(CITRINE_ENV_VAR_PREFIX.length);
        if (NON_CONFIG_ENV_VARS.has(envKeyWithoutPrefix)) {
          continue;
        }
        // Resolve the whole name against the schema before touching `config`. Every
        // segment must match, including the last: a name that matches nothing would
        // otherwise be written under its own lowercase spelling and then stripped by
        // Zod, leaving a misspelled variable looking as though it had been applied.
        // Resolving up front also keeps a rejected name from leaving half-built
        // objects behind, which would make Zod fail about an unrelated field.
        const segments = envKeyWithoutPrefix.split('_');
        const schemaKeys: string[] = [];
        let keyMapLevel: Record<string, any> | undefined = configKeyMap;
        let unknownSegment: string | undefined;

        for (const segment of segments) {
          // No level left to search means an earlier segment was a leaf field.
          const match: KeyMapMatch | undefined = keyMapLevel
            ? this.lookupSegment(keyMapLevel, segment)
            : undefined;
          if (!match) {
            unknownSegment = segment;
            break;
          }
          schemaKeys.push(match.key);
          keyMapLevel = match.child;
        }

        if (unknownSegment !== undefined) {
          errors.push(
            `Environment variable '${fullEnvKey}' refers to unknown configuration field '${unknownSegment}'.`,
          );
          continue;
        }

        let currentConfigPart: Record<string, any> = config;
        let conflictingSegment: string | undefined;

        for (const key of schemaKeys.slice(0, -1)) {
          const existing = currentConfigPart[key];
          if (existing === undefined) {
            currentConfigPart[key] = {};
          } else if (typeof existing !== 'object' || existing === null) {
            conflictingSegment = key;
            break;
          }
          currentConfigPart = currentConfigPart[key];
        }

        if (conflictingSegment !== undefined) {
          errors.push(
            `Environment variable '${fullEnvKey}' refers to configuration segment '${conflictingSegment}', but its current value is not an object.`,
          );
          continue;
        }

        const keyToUse = schemaKeys[schemaKeys.length - 1];
        try {
          currentConfigPart[keyToUse] = JSON.parse(value as string);
        } catch {
          console.debug(`Mapping '${value}' as string for environment variable '${fullEnvKey}'.`);
          currentConfigPart[keyToUse] = value;
        }
      }
    }

    errors.forEach((err) => console.error(err));

    return config;
  }

  /**
   * Resolves one path segment against a level of the key map.
   *
   * A level holds leaf fields as `lowercasename -> realKey` and nested objects as
   * `realKey -> submap`, so both spellings have to be tried.
   *
   * @returns The real schema key, plus the submap to descend into when the segment named
   *   a nested object. `child` is undefined for a leaf field, which is what tells the
   *   caller that a further segment cannot resolve. Undefined when nothing matched.
   */
  private static lookupSegment(
    keyMap: Record<string, any>,
    segment: string,
  ): KeyMapMatch | undefined {
    const mapped = keyMap[segment];
    if (typeof mapped === 'string') {
      return { key: mapped };
    }
    const key = Object.keys(keyMap).find((candidate) => candidate.toLowerCase() === segment);
    if (!key) {
      return undefined;
    }
    const child = keyMap[key];
    return { key, child: typeof child === 'object' && child !== null ? child : undefined };
  }

  private static getZodSchemaKeyMap(schema: z.ZodTypeAny): Record<string, any> {
    if (
      schema instanceof z.ZodNullable ||
      schema instanceof z.ZodOptional ||
      schema instanceof z.ZodDefault ||
      schema instanceof z.ZodPrefault ||
      schema instanceof z.ZodNonOptional ||
      schema instanceof z.ZodCatch ||
      schema instanceof z.ZodReadonly
    ) {
      return this.getZodSchemaKeyMap(schema.unwrap() as z.ZodTypeAny);
    }

    if (schema instanceof z.ZodArray) {
      return this.getZodSchemaKeyMap(schema.element as z.ZodTypeAny);
    }

    if (schema instanceof z.ZodUnion) {
      return (schema.options as z.ZodTypeAny[]).reduce(
        (acc, option) => Object.assign(acc, this.getZodSchemaKeyMap(option)),
        {} as Record<string, any>,
      );
    }

    if (schema instanceof z.ZodObject) {
      const entries = Object.entries<z.ZodType>(schema.shape);

      return entries.reduce(
        (acc, [key, value]) => {
          const nested = this.getZodSchemaKeyMap(value);

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
  }
}
