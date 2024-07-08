/* eslint-disable @typescript-eslint/no-unused-vars */

// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import 'reflect-metadata';
import { ILogObj, Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';
import { AS_HANDLER_METADATA, IHandlerDefinition, IModule } from '.';
import { OcppRequest, OcppResponse } from '../..';
import { SystemConfig } from '../../config/types';
import { CallAction, ErrorCode, OcppError } from '../../ocpp/rpc/message';
import { RequestBuilder } from '../../util/request';
import { CacheNamespace, ICache } from '../cache/cache';
import {
  EventGroup,
  HandlerProperties,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  MessageOrigin,
  MessageState,
} from '../messages';

export abstract class AbstractModule implements IModule {
  public static readonly CALLBACK_URL_CACHE_PREFIX: string = 'CALLBACK_URL_';

  protected _config: SystemConfig;
  protected readonly _cache: ICache;
  protected readonly _handler: IMessageHandler;
  protected readonly _sender: IMessageSender;
  protected readonly _eventGroup: EventGroup;
  protected readonly _logger: Logger<ILogObj>;

  constructor(
    config: SystemConfig,
    cache: ICache,
    handler: IMessageHandler,
    sender: IMessageSender,
    eventGroup: EventGroup,
    logger?: Logger<ILogObj>,
  ) {
    this._config = config;
    this._handler = handler;
    this._sender = sender;
    this._eventGroup = eventGroup;
    this._cache = cache;

    this._logger = this._initLogger(logger);

    // Set module for proper message flow.
    this.handler.module = this;
  }

  /**
   * Getters & Setters
   */

  get cache(): ICache {
    return this._cache;
  }

  get sender(): IMessageSender {
    return this._sender;
  }

  get handler(): IMessageHandler {
    return this._handler;
  }

  get config(): SystemConfig {
    return this._config;
  }

  /**
   * Sets the system configuration for the module.
   *
   * @param {SystemConfig} config - The new configuration to set.
   */
  set config(config: SystemConfig) {
    this._config = config;
    // Update all necessary settings for hot reload
    this._logger.info(
      `Updating system configuration for ${this._eventGroup} module...`,
    );
    this._logger.settings.minLevel = this._config.logLevel;
  }

  /**
   * Methods
   */

  /**
   * Handles a message with an OcppRequest or OcppResponse payload.
   *
   * @param {IMessage<OcppRequest | OcppResponse>} message - The message to handle.
   * @param {HandlerProperties} props - Optional properties for the handler.
   * @return {void} This function does not return anything.
   */
  async handle(
    message: IMessage<OcppRequest | OcppResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    if (message.state === MessageState.Response) {
      this.handleMessageApiCallback(message as IMessage<OcppResponse>);
      this._cache.set(
        message.context.correlationId,
        JSON.stringify(message.payload),
        message.context.stationId,
        this._config.maxCachingSeconds,
      );
    }
    try {
      const handlerDefinition = (
        Reflect.getMetadata(
          AS_HANDLER_METADATA,
          this.constructor,
        ) as Array<IHandlerDefinition>
      )
        .filter((h) => h.action === message.action)
        .pop();
      if (handlerDefinition) {
        await handlerDefinition.method.call(this, message, props);
      } else {
        throw new OcppError(
          message.context.correlationId,
          ErrorCode.NotSupported,
          'No handler found for action: ' +
            message.action +
            ' at module ' +
            this._eventGroup,
        );
      }
    } catch (error) {
      this._logger.error('Failed handling message: ', error, message);
      if (error instanceof OcppError) {
        this._sender.sendResponse(message, error);
      } else {
        this._sender.sendResponse(
          message,
          new OcppError(
            message.context.correlationId,
            ErrorCode.InternalError,
            'Failed handling message: ' + error,
          ),
        );
      }
    }
  }

  /**
   * Interface methods.
   */

  /**
   * Unimplemented method to handle incoming {@link IMessage}.
   *
   * **Note**: This method is **programmatically** overridden by the {@link ModuleHandlers} annotation.
   *
   * @param message The {@link IMessage} to handle. Can contain either a {@link OcppRequest} or a {@link OcppResponse} as payload.
   * @param props The {@link HandlerProperties} for this {@link IMessage} containing implementation specific metadata. Metadata is not used in the base implementation.
   */

  async handleMessageApiCallback(
    message: IMessage<OcppResponse>,
  ): Promise<void> {
    const url: string | null = await this._cache.get(
      message.context.correlationId,
      AbstractModule.CALLBACK_URL_CACHE_PREFIX + message.context.stationId,
    );
    if (url) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message.payload),
        });
      } catch (error) {
        // TODO: Ideally the error log is also stored in the database in a failed invocations table to ensure these are visible outside of a log file.
        this._logger.error('Failed sending call result: ', error);
      }
    }
  }

  /**
   * Calls shutdown on the handler and sender.
   *
   * Note: To be overwritten by subclass if other logic is necessary.
   *
   */
  shutdown(): void {
    this._handler.shutdown();
    this._sender.shutdown();
  }

  /**
   * Default implementation
   */

  /**
   * Sends a call with the specified identifier, tenantId, action, payload, and origin.
   *
   * @param {string} identifier - The identifier of the call.
   * @param {string} tenantId - The tenant ID.
   * @param {CallAction} action - The action to be performed.
   * @param {OcppRequest} payload - The payload of the call.
   * @param {string} [callbackUrl] - The callback URL for the call.
   * @param {string} [correlationId] - The correlation ID of the call.
   * @param {MessageOrigin} [origin] - The origin of the call.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the message confirmation.
   */
  public sendCall(
    identifier: string,
    tenantId: string,
    action: CallAction,
    payload: OcppRequest,
    callbackUrl?: string,
    correlationId?: string,
    origin: MessageOrigin = MessageOrigin.ChargingStationManagementSystem,
  ): Promise<IMessageConfirmation> {
    const _correlationId: string =
      correlationId === undefined ? uuidv4() : correlationId;
    if (callbackUrl) {
      // TODO: Handle callErrors, failure to send to charger, timeout from charger, with different responses to callback
      this._cache.set(
        _correlationId,
        callbackUrl,
        AbstractModule.CALLBACK_URL_CACHE_PREFIX + identifier,
        this._config.maxCachingSeconds,
      );
    }
    // TODO: Future - Compound key with tenantId
    return this._cache
      .get(identifier, CacheNamespace.Connections)
      .then((connection) => {
        if (connection) {
          return this._sender.sendRequest(
            RequestBuilder.buildCall(
              identifier,
              _correlationId,
              tenantId,
              action,
              payload,
              this._eventGroup,
              origin,
            ),
          );
        } else {
          this._logger.error(
            'Failed sending call. No connection found for identifier: ',
            identifier,
          );
          return Promise.resolve({
            success: false,
            payload: 'No connection found for identifier: ' + identifier,
          });
        }
      });
  }

  /**
   * Sends the call result message and returns a Promise that resolves with the confirmation message.
   *
   * @param {string} correlationId - The correlation ID of the message.
   * @param {string} identifier - The identifier of the message.
   * @param {string} tenantId - The ID of the tenant.
   * @param {CallAction} action - The call action.
   * @param {OcppResponse} payload - The payload of the call result message.
   * @param {MessageOrigin} origin - (optional) The origin of the message.
   * @return {Promise<IMessageConfirmation>} A Promise that resolves with the confirmation message.
   */
  public sendCallResult(
    correlationId: string,
    identifier: string,
    tenantId: string,
    action: CallAction,
    payload: OcppResponse,
    origin: MessageOrigin = MessageOrigin.ChargingStationManagementSystem,
  ): Promise<IMessageConfirmation> {
    return this._sender.sendResponse(
      RequestBuilder.buildCallResult(
        identifier,
        correlationId,
        tenantId,
        action,
        payload,
        this._eventGroup,
        origin,
      ),
    );
  }

  /**
   * Sends the call result using the request message's fields.
   * Payload will overwrite message.payload.
   *
   * @param {IMessage<OcppRequest>} message - The request message object.
   * @param {OcppResponse} payload - The payload to send.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the message confirmation.
   */
  public sendCallResultWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppResponse,
  ): Promise<IMessageConfirmation> {
    message.origin = MessageOrigin.ChargingStationManagementSystem;
    return this._sender.sendResponse(message, payload);
  }

  /**
   * Sends the call error message and returns a Promise that resolves with the confirmation message.
   *
   * @param {string} correlationId - The correlation ID of the message.
   * @param {string} identifier - The identifier of the message.
   * @param {string} tenantId - The ID of the tenant.
   * @param {CallAction} action - The call action.
   * @param {OcppError} payload - The payload of the call error message.
   * @param {MessageOrigin} origin - (optional) The origin of the message.
   * @return {Promise<IMessageConfirmation>} A Promise that resolves with the confirmation message.
   */
  public sendCallError(
    correlationId: string,
    identifier: string,
    tenantId: string,
    action: CallAction,
    payload: OcppError,
    origin: MessageOrigin = MessageOrigin.ChargingStationManagementSystem,
  ): Promise<IMessageConfirmation> {
    return this._sender.sendResponse(
      RequestBuilder.buildCallError(
        identifier,
        correlationId,
        tenantId,
        action,
        payload,
        this._eventGroup,
        origin,
      ),
    );
  }

  /**
   * Sends the call error using the request message's fields.
   * Payload will overwrite message.payload.
   *
   * @param {IMessage<OcppRequest>} message - The request message object.
   * @param {OcppResponse} payload - The payload to send.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the message confirmation.
   */
  public sendCallErrorWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppError,
  ): Promise<IMessageConfirmation> {
    message.origin = MessageOrigin.ChargingStationManagementSystem;
    return this._sender.sendResponse(message, payload);
  }

  /**
   * Initializes the logger for the class.
   *
   * @return {Logger<ILogObj>} The initialized logger.
   */
  protected _initLogger(baseLogger?: Logger<ILogObj>): Logger<ILogObj> {
    return baseLogger
      ? baseLogger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({
          name: this.constructor.name,
          minLevel: this._config.logLevel,
          hideLogPositionForProduction: this._config.env === 'production',
        });
  }

  /**
   * Initializes the handler for handling requests and responses.
   *
   * @param {CallAction[]} requests - The array of call actions for requests.
   * @param {CallAction[]} responses - The array of call actions for responses.
   * @return {Promise<boolean>} Returns a promise that resolves to a boolean indicating if the initialization was successful.
   */
  protected async _initHandler(
    requests: CallAction[],
    responses: CallAction[],
  ): Promise<boolean> {
    this._handler.module = this;

    let success = await this._handler.subscribe(
      this._eventGroup.toString() + '_requests',
      requests,
      {
        state: MessageState.Request.toString(),
      },
    );

    success =
      success &&
      (await this._handler.subscribe(
        this._eventGroup.toString() + '_responses',
        responses,
        {
          state: MessageState.Response.toString(),
        },
      ));

    return success;
  }
}
