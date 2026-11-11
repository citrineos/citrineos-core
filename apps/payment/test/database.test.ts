// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { toSystemConfig } from '../src/db/database.js';
import { RuntimeEnv } from '../src/config/types.js';

describe('toSystemConfig', () => {
  it('hands the DAL this app’s database settings and never lets it alter the schema', () => {
    const config = {
      env: RuntimeEnv.Development,
      database: {
        host: 'db.internal',
        port: 6543,
        database: 'payments',
        username: 'payment',
        password: 'secret',
      },
    };

    const systemConfig = toSystemConfig(config);

    expect(systemConfig.database).toMatchObject({
      host: 'db.internal',
      port: 6543,
      database: 'payments',
      username: 'payment',
      password: 'secret',
      dialect: 'postgres',
      sync: false,
      alter: false,
      force: false,
    });
  });
});
