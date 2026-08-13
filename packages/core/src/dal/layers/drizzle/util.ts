// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig } from '@citrineos/base';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import pg from 'pg';
import { type ILogObj, Logger } from 'tslog';
import { formatDriftReport, resolveValidationMode } from './validation/report.js';
import { registeredTables } from './validation/registry.js';
import { SchemaDriftError, validateDrizzleSchema } from './validation/validateSchema.js';

export class DefaultDrizzleInstance {
  private static readonly DEFAULT_RETRIES = 5;
  private static readonly DEFAULT_RETRY_DELAY = 5000;
  private static instance: NodePgDatabase | null = null;
  private static pool: Pool | null = null;
  private static logger: Logger<ILogObj>;
  private static config: BootstrapConfig;

  private constructor() {}

  public static getInstance(config: BootstrapConfig, logger?: Logger<ILogObj>): NodePgDatabase {
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
   * Verifies the database is usable before the server starts serving traffic:
   * connects (with retries), then checks the live schema against the drizzle
   * table declarations.
   *
   * Throws on failure so the caller can exit rather than starting a server whose
   * queries are guaranteed to fail.
   */
  public static async initialize(): Promise<void> {
    await this.waitForConnection();
    await this.validateSchema();
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

  /**
   * Compares the drizzle schema declarations against the live database and, in
   * `strict` mode, refuses to continue when they disagree.
   *
   * Controlled by `CITRINEOS_SCHEMA_VALIDATION`:
   *   strict (default) - log every difference and throw, so startup fails
   *   warn             - log every difference and continue
   *   off              - skip the check entirely
   *
   * Set `CITRINEOS_SCHEMA_VALIDATION_CHECK_DEFAULTS=true` to additionally compare
   * whether columns have a database default. Off by default because most defaults
   * in this schema are application-side.
   */
  private static async validateSchema(): Promise<void> {
    const { mode, warning } = resolveValidationMode(process.env.CITRINEOS_SCHEMA_VALIDATION);
    if (warning) this.logger.warn(warning);

    if (mode === 'off') {
      this.logger.warn('Drizzle schema validation skipped (CITRINEOS_SCHEMA_VALIDATION=off)');
      return;
    }

    const checkDefaults = process.env.CITRINEOS_SCHEMA_VALIDATION_CHECK_DEFAULTS === 'true';
    const startedAt = Date.now();
    const findings = await validateDrizzleSchema(this.instance!, { checkDefaults });
    const elapsedMs = Date.now() - startedAt;

    if (findings.length === 0) {
      this.logger.info(
        `Drizzle schema validated against database: ${registeredTables().length} table(s) in sync (${elapsedMs}ms)`,
      );
      return;
    }

    const report = formatDriftReport(findings, mode);
    if (mode === 'warn') {
      this.logger.warn(report);
      return;
    }

    throw new SchemaDriftError(findings, report);
  }
}
