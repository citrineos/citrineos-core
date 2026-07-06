// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IDtoEventSubscriber, IDtoPayload } from '../index.js';
import { DtoEventType } from '../index.js';
import type { Client, Notification } from 'pg';
import pg from 'pg';
// import { runner, RunnerOption } from 'node-pg-migrate';
// import path from 'path';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { OcpiConfig } from '../../config/ocpi.types.js';
import { OcpiConfigToken } from '../../config/ocpi.types.js';
import { Inject, Service } from 'typedi';

const { Client: PgClient } = pg;

interface IPgNotification {
  operation: DtoEventType;
  data: any;
}

type EventHandler<T = any> = {
  handleEvent: (event: { eventType: DtoEventType; payload: T }) => void;
  handleError: (error: any) => void;
  handleDisconnect?: () => void;
};

@Service()
export class PgNotifyEventSubscriber implements IDtoEventSubscriber {
  protected _pgClient: Client;
  protected readonly _logger: Logger<ILogObj>;
  protected subscribedChannels = new Set<string>();
  protected eventHandlers = new Map<string, EventHandler>();

  constructor(@Inject(OcpiConfigToken) config: OcpiConfig, logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._pgClient = new PgClient({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.database,
    });
  }

  async init(): Promise<void> {
    await this._pgClient.connect();
    this._logger.info('Connected to PostgreSQL for notifications');

    /* const runnerOptions: RunnerOption = {
      dbClient: this._pgClient,
      migrationsTable: 'pgmigrations',
      dir: path.join(__dirname, 'migrations'),
      direction: 'up',
      logger: this._logger,
    };
    const migrations = await runner(runnerOptions);
    this._logger.info(
      `Executed migrations: ${migrations.map((m) => m.name).join(', ')}`,
    );
*/
    this._pgClient.on('notification', (msg: Notification) => {
      const handler = this.eventHandlers.get(msg.channel);
      if (!handler) return;

      try {
        const payload: IPgNotification = JSON.parse(msg.payload ?? '{}');
        handler.handleEvent({
          eventType: payload.operation,
          payload: payload.data,
        });
      } catch (err) {
        this._logger.error(`Failed to parse notification payload:`, err);
        handler.handleError(err);
      }
    });

    const callDisconnectHandlers = () => {
      const called = new Set<() => void>();
      for (const { handleDisconnect } of this.eventHandlers.values()) {
        if (handleDisconnect && !called.has(handleDisconnect)) {
          called.add(handleDisconnect);
          try {
            handleDisconnect();
          } catch (err) {
            this._logger.warn('Error in handleDisconnect callback:', err);
          }
        }
      }
    };

    this._pgClient.on('error', (err) => {
      this._logger.error('Postgres client error:', err);
      callDisconnectHandlers();
    });

    this._pgClient.on('end', () => {
      this._logger.warn('Postgres client disconnected');
      callDisconnectHandlers();
    });
  }

  async subscribe<T extends IDtoPayload>(
    eventId: string,
    handleEvent: (event: { eventType: DtoEventType; payload: T }) => void,
    handleError: (error: any) => void,
    handleDisconnect?: () => void,
  ): Promise<boolean> {
    try {
      if (!this.subscribedChannels.has(eventId)) {
        await this._pgClient.query(`LISTEN "${eventId}"`);
        this.subscribedChannels.add(eventId);
        this._logger.info(`Subscribed to event channel "${eventId}"`);
      }

      this.eventHandlers.set(eventId, {
        handleEvent,
        handleError,
        handleDisconnect,
      });

      return true;
    } catch (error) {
      this._logger.error(`Failed to subscribe to "${eventId}":`, error);
      handleError(error);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.eventHandlers.clear();
      this.subscribedChannels.clear();
      await this._pgClient.end();
      this._logger.info('Postgres client closed');
    } catch (err) {
      this._logger.error('Error shutting down pg client:', err);
    }
  }
}
