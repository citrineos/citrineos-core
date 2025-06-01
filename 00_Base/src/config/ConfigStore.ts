// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IFileStorage } from '../interfaces/files';
import { SystemConfig } from './types';

export interface ConfigStore extends IFileStorage {
  fetchConfig(): Promise<SystemConfig | null>;
  saveConfig(config: SystemConfig): Promise<void>;
}

export class ConfigStoreFactory {
  private static instance: ConfigStore | null = null;

  static setConfigStore(configStorage: ConfigStore): ConfigStore {
    if (this.instance === null) {
      this.instance = configStorage;
    } else {
      console.warn('ConfigStore has already been initialized.');
    }
    return this.instance;
  }

  static getInstance(): ConfigStore {
    if (this.instance === null) {
      throw new Error(
        'ConfigStore has not been initialized. Call ConfigStoreFactory.setConfigStore() first.',
      );
    }
    return this.instance;
  }
}
