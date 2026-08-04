import type { IFileStorage } from '@interfaces/files/index.js';
import { type Config } from './types.js';

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
  private fileStorage: IFileStorage;

  constructor(fileStorage: IFileStorage) {
    this.fileStorage = fileStorage;
  }

  public loadConfig(configStore: Config): Promise<Config> {
    throw new Error('Method not implemented.');
  }
}
