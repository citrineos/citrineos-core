// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Ajv, ErrorObject } from 'ajv';

import {
  Call,
  CallAction,
  CallResult,
  ICache,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  MessageOrigin,
  MessageState,
  OCPP1_6_CALL_RESULT_SCHEMA_MAP,
  OCPP1_6_CALL_SCHEMA_MAP,
  OCPP2_0_1_CALL_RESULT_SCHEMA_MAP,
  OCPP2_0_1_CALL_SCHEMA_MAP,
  OcppError,
  OcppRequest,
  OcppResponse,
  OCPPVersion,
  OCPPVersionType,
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
  protected _networkHook: (identifier: string, message: string) => Promise<void>;

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
    networkHook: (identifier: string, message: string) => Promise<void>,
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

  set networkHook(value: (identifier: string, message: string) => Promise<void>) {
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
          message.protocol,
          message.action,
          message.payload,
          message.origin,
        );
      } else {
        await this.sendCallResult(
          message.context.correlationId,
          message.context.stationId,
          message.context.tenantId,
          message.protocol,
          message.action,
          message.payload,
          message.origin,
        );
      }
    } else if (message.state === MessageState.Request) {
      await this.sendCall(
        message.context.stationId,
        message.context.tenantId,
        message.protocol,
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
   * @param {string} protocol - The subprotocol of the Websocket, i.e. "ocpp1.6" or "ocpp2.0.1".
   * @return {boolean} - Returns true if the Call object is valid, false otherwise.
   */
  protected _validateCall(
    identifier: string,
    message: Call,
    protocol: string,
  ): { isValid: boolean; errors?: ErrorObject[] | null } {
    const action = message[2];
    const payload = message[3];

    let schema: any;
    switch (protocol) {
      case OCPPVersion.OCPP1_6:
        schema = OCPP1_6_CALL_SCHEMA_MAP.get(action);
        break;
      case OCPPVersion.OCPP2_0_1:
        schema = OCPP2_0_1_CALL_SCHEMA_MAP.get(action);
        break;
      default:
        this._logger.error('Unknown subprotocol', protocol);
        return { isValid: false };
    }

    if (schema) {
      let validate = this._ajv.getSchema(schema['$id']);
      if (!validate) {
        schema['$id'] = `${protocol}-${schema['$id']}`;
        this._logger.debug(`Updated call result schema id: ${schema['$id']}`);
        validate = this._ajv.compile(schema);
      }
      const result = validate(payload);
      if (!result) {
        const validationErrorsDeepCopy = JSON.parse(JSON.stringify(validate.errors));
        this._logger.debug('Validate CallResult failed', validationErrorsDeepCopy);
        return { isValid: false, errors: validationErrorsDeepCopy };
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
   * @param {string} protocol - The protocol of the Websocket.
   * @return {boolean} - Returns true if the CallResult object is valid, false otherwise.
   */
  protected _validateCallResult(
    identifier: string,
    action: CallAction,
    message: CallResult,
    protocol: string,
  ): { isValid: boolean; errors?: ErrorObject[] | null } {
    const payload = message[2];

    let schema: any;
    switch (protocol) {
      case OCPPVersion.OCPP1_6:
        schema = OCPP1_6_CALL_RESULT_SCHEMA_MAP.get(action);
        break;
      case OCPPVersion.OCPP2_0_1:
        schema = OCPP2_0_1_CALL_RESULT_SCHEMA_MAP.get(action);
        break;
      default:
        this._logger.error('Unknown subprotocol', protocol);
        return { isValid: false };
    }
    if (schema) {
      let validate = this._ajv.getSchema(schema['$id']);
      if (!validate) {
        schema['$id'] = `${protocol}-${schema['$id']}`;
        this._logger.debug(`Updated call result schema id: ${schema['$id']}`);
        validate = this._ajv.compile(schema);
      }
      const result = validate(payload);
      if (!result) {
        const validationErrorsDeepCopy = JSON.parse(JSON.stringify(validate.errors));
        this._logger.debug('Validate CallResult failed', validationErrorsDeepCopy);
        return { isValid: false, errors: validationErrorsDeepCopy };
      } else {
        return { isValid: true };
      }
    } else {
      this._logger.error('No schema found for call result with action', action, message);
      return { isValid: false }; // TODO: Implement config for this behavior
    }
  }

  abstract onMessage(
    identifier: string,
    message: string,
    timestamp: Date,
    protocol: string,
  ): Promise<boolean>;

  abstract registerConnection(
    tenantId: number,
    stationId: string,
    protocol: string,
  ): Promise<boolean>;
  abstract deregisterConnection(tenantId: number, stationId: string): Promise<boolean>;

  abstract sendCall(
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppRequest,
    correlationId?: string,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;
  abstract sendCallResult(
    correlationId: string,
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppResponse,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;
  abstract sendCallError(
    correlationId: string,
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    error: OcppError,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;

  abstract shutdown(): Promise<void>;
}
