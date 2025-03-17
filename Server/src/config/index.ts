import { ConfigStoreFactory, SystemConfig } from '@citrineos/base';
import { createLocalConfig } from './envs/local';
import { createDockerConfig } from './envs/docker';

async function getConfigFromEnv(): Promise<SystemConfig> {
  switch (process.env.APP_ENV) {
    case 'local':
      return createLocalConfig();
    case 'docker':
      return createDockerConfig();
    default:
      throw new Error(`Invalid APP_ENV "${process.env.APP_ENV}"`);
  }
}

async function getOrCreateConfig(): Promise<SystemConfig> {
  const config = await getConfigFromEnv();

  const configStore = ConfigStoreFactory.create(config.util.configStorage);

  try {
    let fetchedConfig = await configStore.fetchConfig();

    if (!fetchedConfig) {
      console.warn('No config found. Creating default config...');
      fetchedConfig = config;
      await configStore.saveConfig(fetchedConfig);
      console.log('Default config saved.');
    } else {
      console.log('Config fetched.');
    }

    return fetchedConfig;
  } catch (error) {
    console.error('Failed to get or create config:', error);
    throw error;
  }
}

export const systemConfig: Promise<SystemConfig> = getOrCreateConfig();
