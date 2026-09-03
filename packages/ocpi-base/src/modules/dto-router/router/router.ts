// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  IDtoEventSender,
  IDtoEventSubscriber,
  IDtoPayload,
  IDtoRouter,
  OcpiConfig,
} from '../../../index.js';
import { DtoEvent, DtoEventObjectType, DtoEventType } from '../../../index.js';
import type { OcpiConfiguredDependencies } from '../../../dependencies.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export interface DtoRouterDependencies extends OcpiConfiguredDependencies {
  rabbitMqDtoSender: IDtoEventSender;
  pgNotifyEventSubscriber: IDtoEventSubscriber;
}

export class DtoRouter implements IDtoRouter {
  protected _config: OcpiConfig;
  protected readonly _sender: IDtoEventSender;
  protected _subscriber: IDtoEventSubscriber;
  protected readonly _logger: Logger<ILogObj>;

  constructor({
    config,
    rabbitMqDtoSender,
    pgNotifyEventSubscriber,
    logger,
  }: DtoRouterDependencies) {
    this._logger = logger.getSubLogger({ name: this.constructor.name });
    this._config = config;
    this._sender = rabbitMqDtoSender;
    this._subscriber = pgNotifyEventSubscriber;
  }

  async init(): Promise<void> {
    await this._sender.init();
    await this._subscriber.init();
  }

  /**
   * Getters & Setters
   */
  get subscriber(): IDtoEventSubscriber {
    return this._subscriber;
  }

  get sender(): IDtoEventSender {
    return this._sender;
  }

  async shutdown(): Promise<void> {
    await this._subscriber.shutdown();
    await this._sender.shutdown();
  }

  async subscribe<T extends IDtoPayload>(
    eventId: string,
    eventType: DtoEventType,
    objectType: DtoEventObjectType,
  ): Promise<boolean> {
    await this._subscriber.subscribe(
      eventId,
      async (event: { eventType: DtoEventType; payload: T }) => {
        this._logger.info(
          `${eventId} received event for eventType ${eventType} and objectType ${objectType}: ${JSON.stringify(event)}`,
        );
        const dtoEvent = new DtoEvent(
          eventId,
          { eventType: event.eventType, objectType },
          event.payload,
        );

        await this._sender.sendEvent(dtoEvent);
      },
      (error) => {
        this._logger.error(
          `${eventId} received error for eventType ${eventType} and objectType ${objectType}: ${error.message}`,
        );
      },
      () => {},
    );
    return true;
  }
}
