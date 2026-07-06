// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import 'reflect-metadata';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IDtoEventHandlerDefinition } from './AsDtoEventHandler.js';
import { AS_DTO_EVENT_HANDLER_METADATA } from './AsDtoEventHandler.js';
import type { IDtoEvent, IDtoEventReceiver, IDtoModule, IDtoPayload } from './types.js';
import { DtoEventObjectType, DtoEventType } from './types.js';
import type { OcpiConfig } from '../index.js';

export abstract class AbstractDtoModule implements IDtoModule {
  protected _config: OcpiConfig;
  protected readonly _receiver: IDtoEventReceiver;
  protected readonly _logger: Logger<ILogObj>;

  protected _eventTypes: DtoEventType[] = [];
  protected _objectTypes: DtoEventObjectType[] = [];
  private startTime = Date.now();

  constructor(config: OcpiConfig, receiver: IDtoEventReceiver, logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._logger.info('Initializing...');
    this._config = config;
    this._receiver = receiver;

    // Set module for proper message flow.
    this.receiver.module = this;
  }

  /**
   * Abstract Methods
   */

  abstract init(): Promise<void>;

  /**
   * Getters & Setters
   */
  get receiver(): IDtoEventReceiver {
    return this._receiver;
  }

  get config(): OcpiConfig {
    return this._config;
  }

  /**
   * Sets the system configuration for the module.
   *
   * @param {OcpiConfig} config - The new configuration to set.
   */
  set config(config: OcpiConfig) {
    this._config = config;
    // Update all necessary settings for hot reload
    this._logger.info(`Updating system configuration for ${this.constructor.name} module...`);
    this._logger.settings.minLevel = this._config.logLevel;
  }

  /**
   * Methods
   */

  /**
   * Handles a GraphQL message.
   *
   * @param {IDtoEvent} message - The message to handle.
   * @param {DtoEventHandlerProperties} props - Optional properties for the handler.
   * @return {void} This function does not return anything.
   */
  async handle(message: IDtoEvent<IDtoPayload>): Promise<void> {
    try {
      const metadata = Reflect.getMetadata(
        AS_DTO_EVENT_HANDLER_METADATA,
        this.constructor,
      ) as Array<IDtoEventHandlerDefinition>;
      this._logger.info(`message._context ${JSON.stringify(message._context)}`);
      const handlerDefinition = metadata
        .filter(
          (h) =>
            h.eventType === message._context.eventType &&
            h.objectType === message._context.objectType,
        )
        .pop();

      if (handlerDefinition) {
        await handlerDefinition.method.call(this, message);
      } else {
        this._logger.warn(
          `No handler found for eventType: ${message._context.eventType} and objectType: ${message._context.objectType} at module ${this.constructor.name}`,
        );
      }
    } catch (error) {
      this._logger.error('Failed handling GraphQL message: ', error, message);
      // Unlike OCPP, GraphQL subscriptions are one-way, so we don't send error responses back
    }
  }

  /**
   * Shuts down the handler and sender.
   */
  async shutdown(): Promise<void> {
    await this._receiver.shutdown();
  }

  /**
   * Initializes the handler for handling GraphQL subscription messages.
   */
  public async initHandlers(): Promise<void> {
    const handlerDefinitions = Reflect.getMetadata(
      AS_DTO_EVENT_HANDLER_METADATA,
      this.constructor,
    ) as Array<IDtoEventHandlerDefinition>;
    for (const handlerDefinition of handlerDefinitions) {
      const result = await this._initHandler(
        handlerDefinition.eventType,
        handlerDefinition.objectType,
        handlerDefinition.eventId,
      );
      if (!result) {
        this._logger.error(
          `Failed to initialize handler for eventType: ${handlerDefinition.eventType} and objectType: ${handlerDefinition.objectType} at module ${this.constructor.name}`,
        );
        throw new Error('Could not initialize module due to failure in handler initialization.');
      }
    }
    this._logger.info(`Initialized in ${Date.now() - this.startTime}ms...`);
  }

  /**
   * Initializes a handler for handling Dto events.
   *
   * @param {DtoEventType[]} eventTypes - The array of event types.
   * @param {DtoEventObjectType[]} objectTypes - The array of event object types.
   * @return {Promise<boolean>} Returns a promise that resolves to a boolean indicating if the initialization was successful.
   */
  private async _initHandler(
    eventType: DtoEventType,
    objectType: DtoEventObjectType,
    eventId: string,
  ): Promise<boolean> {
    this._receiver.module = this;

    const success = await this._receiver.subscribe(eventType, objectType, {
      eventId: eventId,
    });

    return success;
  }
}
