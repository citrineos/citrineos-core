// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SystemConfig } from '@citrineos/types';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import pg from 'pg';
import { type ILogObj, Logger } from 'tslog';

export class DefaultDrizzleInstance {
  private static readonly DEFAULT_RETRIES = 5;
  private static readonly DEFAULT_RETRY_DELAY = 5000;
  private static instance: NodePgDatabase | null = null;
  private static pool: Pool | null = null;
  private static logger: Logger<ILogObj>;
  private static config: SystemConfig;

  private constructor() {}

  public static getInstance(config: SystemConfig, logger?: Logger<ILogObj>): NodePgDatabase {
    if (!DefaultDrizzleInstance.instance) {
      DefaultDrizzleInstance.config = config;
      DefaultDrizzleInstance.logger = logger
        ? logger.getSubLogger({ name: this.name })
        : new Logger<ILogObj>({ name: this.name });

      DefaultDrizzleInstance.pool = new pg.Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        user: config.database.username,
        password: config.database.password,
        max: config.database.pool?.max,
        min: config.database.pool?.min,
        idleTimeoutMillis: config.database.pool?.idle,
        connectionTimeoutMillis: config.database.pool?.acquire,
        ...(config.database.ssl && { ssl: config.database.ssl }),
      });

      DefaultDrizzleInstance.instance = drizzle(DefaultDrizzleInstance.pool);
    }
    return DefaultDrizzleInstance.instance;
  }

  public static async initialize(): Promise<void> {
    const maxRetries = this.config.database.maxRetries ?? this.DEFAULT_RETRIES;
    const retryDelay = this.config.database.retryDelay ?? this.DEFAULT_RETRY_DELAY;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const client = await this.pool!.connect();
        client.release();
        this.logger.info('Drizzle database connection established successfully');
        break;
      } catch (error) {
        retryCount++;
        this.logger.error(
          `Failed to connect to database via Drizzle (attempt ${retryCount}/${maxRetries}):`,
          error,
        );
        if (retryCount < maxRetries) {
          this.logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          this.logger.error(
            'Max retries reached. Unable to establish Drizzle database connection.',
          );
        }
      }
    }
  }
}
