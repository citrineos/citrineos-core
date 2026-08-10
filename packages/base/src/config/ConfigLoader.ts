import { configSchema, type SystemConfig, type SystemConfigInput } from '@citrineos/types';
import { z } from 'zod';

const args = typeof process !== 'undefined' && process.argv ? process.argv.slice(2) : [];

let dynamicPrefix = 'citrineos_';
for (const arg of args) {
  if (arg.startsWith('--env-prefix=')) {
    dynamicPrefix = arg.split('=')[1].toLowerCase();
    break;
  }
}

const CITRINE_ENV_VAR_PREFIX = dynamicPrefix;

export class ConfigLoader {
  public async loadConfig(): Promise<SystemConfig> {
    const configFromEnv = this.mergeConfigFromEnvVars({}, process.env);
    return configSchema.parse(configFromEnv);
  }

  /**
   * Merges configuration from environment variables into the default configuration. Allows any to keep it as generic as possible.
   * @param config The default configuration.
   * @param envVars The environment variables.
   * @returns The merged configuration.
   */
  private mergeConfigFromEnvVars(
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
        const path = envKeyWithoutPrefix.split('_');

        let currentConfigPart: Record<string, any> = config;
        let currentConfigKeyMap: Record<string, any> = configKeyMap;
        let validMapping = true;

        for (let i = 0; i < path.length - 1; i++) {
          const part = path[i];
          const lowerTargetKey = part.toLowerCase();
          const matchingKey = Object.keys(currentConfigKeyMap).find(
            (key) => key.toLowerCase() === lowerTargetKey,
          );
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

    return config;
  }

  // private async loadWebsocketServersConfig(): Promise<WebsocketServerConfig[]> {
  //   const configString = await this.fileStorage.getFile(this.configFileName, this.configBucketName);
  //   if (!configString) throw new Error('Websocket servers config file not found.');
  //   return JSON.parse(configString) as WebsocketServerConfig[];
  // }

  private getZodSchemaKeyMap(schema: z.ZodTypeAny): Record<string, any> {
    if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
      return this.getZodSchemaKeyMap((schema as z.ZodNullable<any> | z.ZodOptional<any>).unwrap());
    }

    if (schema instanceof z.ZodArray) {
      return this.getZodSchemaKeyMap(schema.element as z.ZodTypeAny);
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
