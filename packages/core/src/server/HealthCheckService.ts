// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ICache } from '@citrineos/base';
import type { Sequelize } from '@dal/index.js';
import type { SchemaValidationReport } from '@dal/layers/sequelize/SchemaValidator.js';
import { RabbitMQConnectionManager, WebsocketNetworkConnection } from '@util/index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

// https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check
// 'warn' reports a degraded but serviceable condition; it does not fail readiness.
type CheckResult = { status: 'pass' | 'fail' | 'warn'; error?: string };
export type HealthCheckResult = { status: 'pass' | 'fail'; checks: Record<string, CheckResult> };

export class HealthCheckService {
  private _isShuttingDown: boolean = false;
  private _notReadyAt: number | null = null;
  private readonly _notReadyThresholdMs: number;
  private readonly _logger: Logger<ILogObj>;
  private _schemaReport: SchemaValidationReport | null = null;

  constructor(
    private readonly _networkConnection: WebsocketNetworkConnection | null | undefined,
    private readonly _connectionManager: RabbitMQConnectionManager | null | undefined,
    private readonly _cache: ICache,
    private readonly _sequelizeInstance: Sequelize,
    notReadyThresholdSeconds: number,
    logger?: Logger<ILogObj>,
  ) {
    this._notReadyThresholdMs = notReadyThresholdSeconds * 1000;
    this._logger = logger
      ? logger.getSubLogger({ name: 'HealthCheckService' })
      : new Logger<ILogObj>({ name: 'HealthCheckService' });
  }

  shutdown() {
    this._isShuttingDown = true;
  }

  /**
   * Records the startup schema validation result so drift is visible on
   * /health/ready rather than only in the boot logs. Errors would have aborted
   * startup already (unless `database.validateSchemaSeverity` is 'warn'), so in
   * practice this surfaces the warning-level findings.
   */
  setSchemaValidationReport(report: SchemaValidationReport | null) {
    this._schemaReport = report;
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    let checks: Record<string, CheckResult> = {};
    let pass = true;
    if (this._isShuttingDown) {
      checks['shutdown'] = { status: 'fail', error: 'shutting down' };
      pass = false;
    } else {
      ({ checks, pass } = await this._checkConnections());
    }

    if (!pass) {
      this._notReadyAt ??= Date.now();
    } else {
      this._notReadyAt = null;
    }

    return { status: pass ? 'pass' : 'fail', checks };
  }

  checkLiveness(): HealthCheckResult {
    if (this._notReadyAt !== null) {
      const durationMs = Date.now() - this._notReadyAt;
      if (durationMs > this._notReadyThresholdMs) {
        const durationSec = Math.round(durationMs / 1000);
        const thresholdSec = this._notReadyThresholdMs / 1000;
        return {
          status: 'fail',
          checks: {
            readiness: {
              status: 'fail',
              error: `Not ready for ${durationSec}s (threshold: ${thresholdSec}s)`,
            },
          },
        };
      }
    }
    return { status: 'pass', checks: {} };
  }

  private async _checkConnections(): Promise<{
    checks: Record<string, CheckResult>;
    pass: boolean;
  }> {
    const checks: Record<string, CheckResult> = {};
    let pass = true;

    if (this._networkConnection) {
      for (const [id, server] of this._networkConnection.getHttpServers()) {
        if (server.listening) {
          checks[`websocket:${id}`] = { status: 'pass' };
        } else {
          checks[`websocket:${id}`] = { status: 'fail', error: 'server not listening' };
          pass = false;
        }
      }
    }

    if (this._connectionManager) {
      if (this._connectionManager.isConnected()) {
        checks['rabbitmq'] = { status: 'pass' };
      } else {
        checks['rabbitmq'] = { status: 'fail', error: 'not connected' };
        pass = false;
      }
    }

    checks['cache'] = await this._checkCache();
    if (checks['cache'].status === 'fail') pass = false;

    checks['database'] = await this._checkDatabase();
    if (checks['database'].status === 'fail') pass = false;

    const schema = this._checkSchema();
    if (schema) checks['schema'] = schema;

    return { checks, pass };
  }

  /**
   * Never fails readiness. Schema drift is a startup gate, not a runtime
   * condition: errors either aborted startup already, or the operator set
   * `database.validateSchemaSeverity` to 'warn' precisely so the service keeps
   * serving. Failing readiness here would pull the instance out of rotation and
   * defeat that. Reported so drift is visible to whatever scrapes /health/ready.
   */
  private _checkSchema(): CheckResult | null {
    if (!this._schemaReport) return null;

    const { errors, warnings } = this._schemaReport;
    if (errors.length > 0) {
      return {
        status: 'warn',
        error:
          `${errors.length} schema validation error(s) suppressed by validateSchemaSeverity=warn: ` +
          errors
            .slice(0, 5)
            .map((f) => f.message)
            .join('; '),
      };
    }
    if (warnings.length > 0) {
      return { status: 'warn', error: `${warnings.length} schema validation warning(s)` };
    }
    return { status: 'pass' };
  }

  private async _checkCache(): Promise<CheckResult> {
    try {
      await this._cache.ping();
      return { status: 'pass' };
    } catch (error) {
      this._logger.error('Cache health check failed', { error });
      return { status: 'fail', error: 'cache unavailable' };
    }
  }

  private _checkDatabase(): CheckResult {
    // Accessing pool is not officially supported, it has been private only for years
    // but Sequelize v6 does not provide any other way to check database connectivity without actually running a query, which we want to avoid in a health check
    const pool = (this._sequelizeInstance.connectionManager as any).pool;
    if (!pool) {
      this._logger.error('Database health check failed: pool unavailable');
      return { status: 'fail', error: 'pool unavailable' };
    }
    if (pool.size === 0 && pool.waiting > 0) {
      this._logger.error('Database health check failed: connections waiting but pool empty', {
        waiting: pool.waiting,
        maxSize: pool.maxSize,
      });
      return { status: 'fail', error: 'database unavailable' };
    }

    return { status: 'pass' };
  }
}
