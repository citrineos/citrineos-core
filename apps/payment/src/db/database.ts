// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { configSchema } from '@citrineos/types';
import type { SystemConfig } from '@citrineos/types';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { ILogObj, Logger } from 'tslog';
import type { PaymentConfig } from '../config/types.js';

export type PaymentDatabase = NodePgDatabase;

export interface DatabaseConnection {
  db: PaymentDatabase;
  /** The pool behind `db`, for SQL Drizzle does not model. */
  pool: pg.Pool;
  close(): Promise<void>;
}

/** Attempts before giving up on a database that is not up yet, e.g. while the stack starts. */
const CONNECT_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

/**
 * The Core repositories this app reads through take a full SystemConfig, but only ever use its
 * database section; everything else is left to the schema's defaults.
 */
export function toSystemConfig(config: Pick<PaymentConfig, 'env' | 'database'>): SystemConfig {
  return configSchema.parse({ env: config.env, database: config.database });
}

/**
 * Connects to Core's database. One pool serves this app's tables and the Core repositories it
 * reads through, which are handed the same Drizzle instance.
 */
export async function connectDatabase(
  config: Pick<PaymentConfig, 'database'>,
  logger?: Logger<ILogObj>,
): Promise<DatabaseConnection> {
  const { host, port, database, username, password } = config.database;
  const pool = new pg.Pool({ host, port, database, user: username, password });
  pool.on('error', (error) => logger?.error('Idle database client failed', error));

  for (let attempt = 1; ; attempt++) {
    try {
      const client = await pool.connect();
      client.release();
      break;
    } catch (error) {
      if (attempt >= CONNECT_ATTEMPTS) {
        await pool.end().catch(() => undefined);
        throw error;
      }
      logger?.warn(
        `Database ${host}:${port}/${database} not reachable (attempt ${attempt}/${CONNECT_ATTEMPTS}), retrying`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  return { db: drizzle(pool), pool, close: () => pool.end() };
}
