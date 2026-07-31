// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ErrorCode, OcppError, OCPPVersion } from '@ocpp/rpc/message.js';
import type { OcppRequest, OcppResponse } from '@ocpp/internal-types.js';
import {
  type IMessage,
  type IMessageConfirmation,
  type IMessageSender,
  MessageOrigin,
} from '@interfaces/messages/index.js';
import { createIdentifier } from '@base-util/identifiers.js';
import { v4 as uuidv4 } from 'uuid';
import type { SystemConfig } from '@config/types.js';
import { OCPPValidator } from '@interfaces/modules/OCPPValidator.js';
import type { ICache } from '@interfaces/cache/cache.js';
import { type ILogObj, Logger } from 'tslog';
import { CacheNamespace, type IWebsocketConnection } from '@interfaces/cache/types.js';
import { RequestBuilder } from '@base-util/request.js';
import type {
  IOcppSender,
  SendCallArgs,
  SendCallErrorArgs,
  SendCallResultArgs,
} from '@interfaces/handlers/IOcppSender.js';

/**
 * OcppSender is primarily for abstracting any OCPP message calls that
 * {@link AbstractHandler}s may use when processing OCPP messages.
 */
export class OcppSender implements IOcppSender {
  private readonly CALLBACK_URL_CACHE_PREFIX: string = 'CALLBACK_URL_';

  protected _config: SystemConfig;
  protected _ocppValidator: OCPPValidator;
  protected readonly _cache: ICache;
  protected readonly _sender: IMessageSender;
  protected readonly _logger: Logger<ILogObj>;

  constructor({
    config,
    cache,
    sender,
    logger,
    ocppValidator,
  }: {
    config: SystemConfig;
    cache: ICache;
    sender: IMessageSender;
    logger?: Logger<ILogObj>;
    ocppValidator?: OCPPValidator;
  }) {
    this._logger = this._initLogger(logger);
    this._ocppValidator = ocppValidator ? ocppValidator : new OCPPValidator(logger);
    this._logger.info('Initializing OcppSender...');
    this._config = config;
    this._sender = sender;
    this._cache = cache;
  }

  /**
   * Sends a call with the specified identifier, tenantId, protocol, action, payload, and origin.
   *
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the message confirmation.
   */
  public async sendCall({
    ocppConnectionName,
    tenantId,
    protocol,
    action,
    eventGroup,
    payload,
    callbackUrl,
    correlationId,
    origin = MessageOrigin.ChargingStationManagementSystem,
  }: SendCallArgs): Promise<IMessageConfirmation> {
    const identifier = createIdentifier(tenantId, ocppConnectionName);
    const _correlationId: string = correlationId === undefined ? uuidv4() : correlationId;

    payload = this._ocppValidator.sanitizeOCPPPayload(payload);
    const { isValid, errors } = this._ocppValidator.validateOCPPRequest(
      action,
      payload,
      protocol as OCPPVersion,
    );

    if (!isValid || errors) {
      throw new OcppError(_correlationId, ErrorCode.FormatViolation, 'Invalid message format', {
        errors: errors,
      });
    }

    if (callbackUrl) {
      // TODO: Handle callErrors, failure to send to charger, timeout from charger, with different responses to callback
      this._logger.debug(
        `Setting callback URL: ${callbackUrl} for correlationId: ${_correlationId}`,
      );
      this._cache
        .set(
          _correlationId,
          callbackUrl,
          this.CALLBACK_URL_CACHE_PREFIX + ocppConnectionName,
          this._config.maxCachingSeconds,
        )
        .then((value) => {
          if (value) {
            this._logger.debug(`Successfully set cache for correlationId: ${_correlationId}`);
          } else {
            this._logger.warn(`Failed to set cache for correlationId: ${_correlationId}`);
          }
        })
        .catch((error) => this._logger.error('Error setting cache: ', error));
    }
    // TODO: Future - Compound key with tenantId
    return this._cache.get<string>(identifier, CacheNamespace.Connections).then((connection) => {
      if (connection) {
        const websocketConnection: IWebsocketConnection = JSON.parse(connection);
        if (websocketConnection.protocol !== protocol) {
          this._logger.error(
            `Failed sending call. Requested protocol: '${protocol}', connection protocol: '${websocketConnection.protocol}' for identifier: `,
            identifier,
          );
          return Promise.resolve({
            success: false,
            payload: `Requested protocol: '${protocol}', connection protocol: '${websocketConnection.protocol}' for identifier: '${identifier}'`,
          });
        }
        return this._sender.sendRequest(
          RequestBuilder.buildCall(
            ocppConnectionName,
            _correlationId,
            tenantId,
            action,
            payload,
            eventGroup,
            origin,
            protocol,
          ),
        );
      } else {
        this._logger.error('Failed sending call. No connection found for identifier: ', identifier);
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
   * @return {Promise<IMessageConfirmation>} A Promise that resolves with the confirmation message.
   */
  public sendCallResult({
    correlationId,
    ocppConnectionName,
    tenantId,
    protocol,
    action,
    eventGroup,
    payload,
    origin = MessageOrigin.ChargingStationManagementSystem,
  }: SendCallResultArgs): Promise<IMessageConfirmation> {
    payload = this._ocppValidator.sanitizeOCPPPayload(payload);
    const { isValid, errors } = this._ocppValidator.validateOCPPResponse(
      action,
      payload,
      protocol as OCPPVersion,
    );

    if (!isValid || errors) {
      throw new OcppError(correlationId, ErrorCode.FormatViolation, 'Invalid message format', {
        errors: errors,
      });
    }

    return this._sender.sendResponse(
      RequestBuilder.buildCallResult(
        ocppConnectionName,
        correlationId,
        tenantId,
        action,
        payload,
        eventGroup,
        origin,
        protocol,
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
    payload = this._ocppValidator.sanitizeOCPPPayload(payload);
    const { isValid, errors } = this._ocppValidator.validateOCPPResponse(
      message.action,
      payload,
      message.protocol as OCPPVersion,
    );

    if (!isValid || errors) {
      throw new OcppError(
        message.context.correlationId,
        ErrorCode.FormatViolation,
        'Invalid message format',
        {
          errors: errors,
        },
      );
    }

    message.origin = MessageOrigin.ChargingStationManagementSystem;
    return this._sender.sendResponse(message, payload);
  }

  /**
   * Sends the call error message and returns a Promise that resolves with the confirmation message.
   *
   * @return {Promise<IMessageConfirmation>} A Promise that resolves with the confirmation message.
   */
  public sendCallError({
    correlationId,
    ocppConnectionName,
    tenantId,
    protocol,
    action,
    eventGroup,
    payload,
    origin = MessageOrigin.ChargingStationManagementSystem,
  }: SendCallErrorArgs): Promise<IMessageConfirmation> {
    return this._sender.sendResponse(
      RequestBuilder.buildCallError(
        ocppConnectionName,
        correlationId,
        tenantId,
        action,
        payload,
        eventGroup,
        origin,
        protocol,
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
}
