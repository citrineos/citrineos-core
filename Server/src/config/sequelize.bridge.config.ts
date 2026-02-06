// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'ts-node/register';
import { loadBootstrapConfig } from '@citrineos/base';

export default (async () => {
  try {
    const bootstrapConfig = loadBootstrapConfig();

    const { host, port, database, dialect, username, password } = bootstrapConfig.database;

    console.log('[sequelize.bridge.config.ts] Loaded config for DB:', {
      host,
      port,
      database,
      dialect,
    });

    return {
      username,
      password,
      database,
      host,
      port,
      dialect,
      logging: true,
    };
  } catch (error) {
    console.error('[sequelize.bridge.config.ts] Failed to load bootstrap configuration:', error);
    throw error;
  }
})();
