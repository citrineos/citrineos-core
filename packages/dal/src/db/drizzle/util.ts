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

  /**
   * Verifies the connection is usable before the server starts serving traffic.
   *
   * Throws on failure so the caller can exit rather than starting a server whose
   * queries are guaranteed to fail. Schema validation is a separate concern and
   * lives with the Sequelize gate in `@citrineos/ocpp`
   * (`assertDrizzleSchemaMatches`), so both are driven by the same
   * `database.validateSchema` configuration and reported the same way.
   */
  public static async initialize(): Promise<void> {
    await this.waitForConnection();
  }

  /**
   * Connects to the database, retrying on failure, and throws if every attempt fails.
   *
   * `database.maxRetries` is the total number of attempts, matching the original
   * behaviour of this method. It is clamped to at least one so a misconfigured value
   * cannot skip connecting altogether and report success.
   */
  private static async waitForConnection(): Promise<void> {
    const maxAttempts = Math.max(1, this.config.database.maxRetries ?? this.DEFAULT_RETRIES);
    const retryDelay = this.config.database.retryDelay ?? this.DEFAULT_RETRY_DELAY;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const client = await this.pool!.connect();
        client.release();
        this.logger.info('Drizzle database connection established successfully');
        return;
      } catch (error) {
        this.logger.error(
          `Failed to connect to database via Drizzle (attempt ${attempt}/${maxAttempts}):`,
          error,
        );

        const isLastAttempt = attempt === maxAttempts;
        if (isLastAttempt) {
          this.logger.error(
            'Max retries reached. Unable to establish Drizzle database connection.',
          );
          // Rethrow rather than returning: previously the retry loop fell through
          // here and startup continued with an unusable pool, so the failure only
          // surfaced later as confusing query errors.
          throw error;
        }

        this.logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
}
