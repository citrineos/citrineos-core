// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import Ajv, { ErrorObject } from 'ajv';

import {
  Call,
  CALL_RESULT_SCHEMA_MAP,
  CALL_SCHEMA_MAP,
  CallAction,
  CallResult,
  ICache,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  MessageOrigin,
  MessageState,
  OcppError,
  OcppRequest,
  OcppResponse,
  SystemConfig,
} from '../..';
import { ILogObj, Logger } from 'tslog';
import { IMessageRouter } from './Router';

export abstract class AbstractMessageRouter implements IMessageRouter {
  /**
   * Fields
   */

  protected _ajv: Ajv;
  protected _cache: ICache;
  protected _config: SystemConfig;
  protected _logger: Logger<ILogObj>;
  protected readonly _handler: IMessageHandler;
  protected readonly _sender: IMessageSender;
  protected _networkHook: (
    identifier: string,
    message: string,
  ) => Promise<boolean>;

  /**
   * Constructor of abstract ocpp router.
   *
   * @param {Ajv} ajv - The Ajv instance to use for schema validation.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    handler: IMessageHandler,
    sender: IMessageSender,
    networkHook: (identifier: string, message: string) => Promise<boolean>,
    logger?: Logger<ILogObj>,
    ajv?: Ajv,
  ) {
    this._config = config;
    this._cache = cache;
    this._handler = handler;
    this._sender = sender;
    this._networkHook = networkHook;
    this._ajv =
      ajv ||
      new Ajv({
        removeAdditional: 'all',
        useDefaults: true,
        coerceTypes: 'array',
        strict: false,
      });
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    // Set module for proper message flow.
    this._handler.module = this;
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

  set networkHook(
    value: (identifier: string, message: string) => Promise<boolean>,
  ) {
    this._networkHook = value;
  }

  /**
   * Sets the system configuration for the module.
   *
   * @param {SystemConfig} config - The new configuration to set.
   */
  set config(config: SystemConfig) {
    this._config = config;
    // Update all necessary settings for hot reload
    this._logger.info('Updating system configuration for ocpp router...');
    this._logger.settings.minLevel = this._config.logLevel;
  }

  /**
   * Public Methods
   */

  async handle(message: IMessage<OcppRequest | OcppResponse | OcppError>): Promise<void> {
    this._logger.debug('Received message:', message);

    if (message.state === MessageState.Response) {
      if (message.payload instanceof OcppError) {
        await this.sendCallError(
          message.context.correlationId,
          message.context.stationId,
          message.context.tenantId,
          message.action,
          message.payload,
          message.origin,
        );
      } else {
        await this.sendCallResult(
          message.context.correlationId,
          message.context.stationId,
          message.context.tenantId,
          message.action,
          message.payload,
          message.origin,
        );
      }
    } else if (message.state === MessageState.Request) {
      await this.sendCall(
        message.context.stationId,
        message.context.tenantId,
        message.action,
        message.payload,
        message.context.correlationId,
        message.origin,
      );
    }
  }

  /**
   * Protected Methods
   */

  /**
   * Validates a Call object against its schema.
   *
   * @param {string} identifier - The identifier of the EVSE.
   * @param {Call} message - The Call object to validate.
   * @return {boolean} - Returns true if the Call object is valid, false otherwise.
   */
  protected _validateCall(
    identifier: string,
    message: Call,
  ): { isValid: boolean; errors?: ErrorObject[] | null } {
    const action = message[2] as CallAction;
    const payload = message[3];

    const schema = CALL_SCHEMA_MAP.get(action);
    if (schema) {
      const validate = this._ajv.compile(schema);
      const result = validate(payload);
      if (!result) {
        this._logger.debug('Validate Call failed', validate.errors);
        return { isValid: false, errors: validate.errors };
      } else {
        return { isValid: true };
      }
    } else {
      this._logger.error('No schema found for action', action, message);
      return { isValid: false }; // TODO: Implement config for this behavior
    }
  }

  /**
   * Validates a CallResult object against its schema.
   *
   * @param {string} identifier - The identifier of the EVSE.
   * @param {CallAction} action - The original CallAction.
   * @param {CallResult} message - The CallResult object to validate.
   * @return {boolean} - Returns true if the CallResult object is valid, false otherwise.
   */
  protected _validateCallResult(
    identifier: string,
    action: CallAction,
    message: CallResult,
  ): { isValid: boolean; errors?: ErrorObject[] | null } {
    const payload = message[2];

    const schema = CALL_RESULT_SCHEMA_MAP.get(action);
    if (schema) {
      const validate = this._ajv.compile(schema);
      const result = validate(payload);
      if (!result) {
        this._logger.debug('Validate CallResult failed', validate.errors);
        return { isValid: false, errors: validate.errors };
      } else {
        return { isValid: true };
      }
    } else {
      this._logger.error(
        'No schema found for call result with action',
        action,
        message,
      );
      return { isValid: false }; // TODO: Implement config for this behavior
    }
  }

  abstract onMessage(identifier: string, message: string): Promise<boolean>;

  abstract registerConnection(connectionIdentifier: string): Promise<boolean>;
  abstract deregisterConnection(connectionIdentifier: string): Promise<boolean>;

  abstract sendCall(
    identifier: string,
    tenantId: string,
    action: CallAction,
    payload: OcppRequest,
    correlationId?: string,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;
  abstract sendCallResult(
    correlationId: string,
    identifier: string,
    tenantId: string,
    action: CallAction,
    payload: OcppResponse,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;
  abstract sendCallError(
    correlationId: string,
    identifier: string,
    tenantId: string,
    action: CallAction,
    error: OcppError,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;

  abstract shutdown(): void;
}
