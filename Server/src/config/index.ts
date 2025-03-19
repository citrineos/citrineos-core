import { ConfigStore, ConfigStoreFactory, SystemConfig } from '@citrineos/base';
import { createLocalConfig } from './envs/local';
import { createDockerConfig } from './envs/docker';
import { createDirectusConfig } from './envs/directus.docker';
import { DirectusUtil, LocalStorage, S3Storage } from '@citrineos/util';

async function getConfigFromEnv(): Promise<SystemConfig> {
  switch (process.env.APP_ENV) {
    case 'local':
      return createLocalConfig();
    case 'docker':
      return createDockerConfig();
    case 'directus':
      return createDirectusConfig();
    default:
      throw new Error(`Invalid APP_ENV "${process.env.APP_ENV}"`);
  }
}

async function getOrCreateConfig(): Promise<SystemConfig> {
  const config = await getConfigFromEnv();

  let fileStorage: ConfigStore | undefined;
  if (config.util.fileAccess.local) {
    fileStorage = new LocalStorage(
      config.util.fileAccess.local.defaultFilePath,
      config.configFileName,
      config.configDir,
    );
  } else if (config.util.fileAccess.s3) {
    fileStorage = new S3Storage(config.util.fileAccess.s3, config.configFileName, config.configDir);
  } else if (config.util.fileAccess.directus) {
    fileStorage = new DirectusUtil(
      config.util.fileAccess.directus,
      config.configFileName,
      config.configDir,
    );
  } else {
    throw new Error('Invalid file access configuration');
  }

  const configStore = ConfigStoreFactory.setConfigStore(fileStorage);

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
