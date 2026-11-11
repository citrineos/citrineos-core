// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DefaultSequelizeInstance } from '@citrineos/dal';
import type { Sequelize } from '@citrineos/dal';
import { configSchema } from '@citrineos/types';
import type { SystemConfig } from '@citrineos/types';
import type { ILogObj, Logger } from 'tslog';
import type { PaymentConfig } from '../config/types.js';
import { PAYMENT_MODELS } from '../models/index.js';

/**
 * The Core repositories this app reads through take a full SystemConfig, but only ever use its
 * database section; everything else is left to the schema's defaults.
 */
export function toSystemConfig(config: Pick<PaymentConfig, 'env' | 'database'>): SystemConfig {
  return configSchema.parse({ env: config.env, database: config.database });
}

/**
 * Connects to Core's database and registers this app's models on the same Sequelize instance as
 * Core's, so payment rows and Core rows are read through one connection pool.
 */
export async function initializeDatabase(
  config: Pick<PaymentConfig, 'env' | 'database'>,
  logger?: Logger<ILogObj>,
): Promise<Sequelize> {
  const sequelize = DefaultSequelizeInstance.getInstance(toSystemConfig(config), logger);
  sequelize.addModels(PAYMENT_MODELS);
  await DefaultSequelizeInstance.initializeSequelize();
  return sequelize;
}
