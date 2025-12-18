// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, SystemConfig } from '@citrineos/base';
import { loadBootstrapConfig } from '@citrineos/base';
import { loadSystemConfig } from './config.loader.js';
import { createLocalConfig } from './envs/local.js';
import { createDockerConfig } from './envs/docker.js';
import { createDirectusConfig } from './envs/directus.docker.js';

/**
 * Get default config based on environment
 * Note: This is only used if no config exists in storage
 */
function getDefaultConfig(): SystemConfig {
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

// Export a promise that resolves to the system configuration
export async function getSystemConfig(bootstrapConfig: BootstrapConfig): Promise<SystemConfig> {
  try {
    return await loadSystemConfig(bootstrapConfig, getDefaultConfig());
  } catch (error) {
    console.error('Failed to initialize system configuration:', error);
    throw error;
  }
}

export const systemConfig: Promise<SystemConfig> = (async () => {
  const bootstrapConfig = loadBootstrapConfig();
  return await getSystemConfig(bootstrapConfig);
})();
