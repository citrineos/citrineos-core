import { S3ConfigStore } from './S3ConfigStore';
import { LocalConfigStore } from './LocalConfigStore';
import { SystemConfig } from './types';

export interface ConfigStore {
  fetchConfig(): Promise<SystemConfig | null>;
  saveConfig(config: SystemConfig): Promise<void>;
}

export class ConfigStoreFactory {
  private static instance: ConfigStore | null = null;

  static create(configStorage: SystemConfig['util']['configStorage']): ConfigStore {
    if (this.instance === null) {
      if (configStorage?.type === 's3' && configStorage.s3) {
        this.instance = new S3ConfigStore(configStorage.s3);
      } else if (configStorage?.type === 'local' && configStorage.local) {
        this.instance = new LocalConfigStore(
          configStorage.local.fileName!,
          configStorage.local.configDir!,
        );
      } else {
        throw new Error('Invalid configStorage configuration');
      }
    }
    return this.instance;
  }

  static getInstance(): ConfigStore {
    if (this.instance === null) {
      throw new Error(
        'ConfigStore has not been initialized. Call ConfigStoreFactory.create() first.',
      );
    }
    return this.instance;
  }
}
