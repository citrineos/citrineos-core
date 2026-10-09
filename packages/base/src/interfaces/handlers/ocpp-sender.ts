// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { serializeError } from '@base-util/errors.js';
import { createIdentifier } from '@base-util/identifiers.js';
import { childLogger, loggerDefaults } from '@base-util/logging.js';
import { RequestBuilder } from '@base-util/request.js';
import {
  ErrorCode,
  OCPPVersion,
  type OcppRequest,
  type OcppResponse,
  type SystemConfig,
} from '@citrineos/types';
import type { ICache } from '@interfaces/cache/cache.js';
import { CacheNamespace, type IWebsocketConnection } from '@interfaces/cache/types.js';
import type { IOcppSender, SendCallArgs } from '@interfaces/handlers/i-ocpp-sender.js';
import {
  type IMessage,
  type IMessageConfirmation,
  type IMessageSender,
  MessageOrigin,
} from '@interfaces/messages/index.js';
import { OCPPValidator } from '@interfaces/modules/ocpp-validator.js';
import { OcppError } from '@ocpp/rpc/message.js';
import type { ILogObj, Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';

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
    this._config = config;
    this._logger = this._initLogger(logger);
    this._ocppValidator = ocppValidator ? ocppValidator : new OCPPValidator(logger);
    this._logger.info('Initializing OcppSender...');
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
    staleAfterSeconds,
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
          this._config.timeouts.maxCachingSeconds,
        )
        .then((value) => {
          if (value) {
            this._logger.debug(`Successfully set cache for correlationId: ${_correlationId}`);
          } else {
            this._logger.warn(`Failed to set cache for correlationId: ${_correlationId}`);
          }
        })
        .catch((error) => this._logger.error('Error setting cache: ', serializeError(error)));
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
        const call = RequestBuilder.buildCall(
          ocppConnectionName,
          _correlationId,
          tenantId,
          action,
          payload,
          eventGroup,
          origin,
          protocol,
        );
        if (staleAfterSeconds !== undefined) {
          call.context.staleAfterSeconds = staleAfterSeconds;
        }
        return this._sender.sendRequest(call);
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

    if (this._stationStoppedWaiting(message)) {
      return Promise.resolve({
        success: false,
        payload: 'The station stopped waiting for this response',
      });
    }
    message.origin = MessageOrigin.ChargingStationManagementSystem;
    message.context = { ...message.context, timestamp: new Date().toISOString() };
    return this._sender.sendResponse(message, payload);
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
    if (this._stationStoppedWaiting(message)) {
      return Promise.resolve({
        success: false,
        payload: 'The station stopped waiting for this response',
      });
    }
    message.origin = MessageOrigin.ChargingStationManagementSystem;
    message.context = { ...message.context, timestamp: new Date().toISOString() };
    return this._sender.sendResponse(message, payload);
  }

  /**
   * True once `request`, a station's Call, is older than maxCallLengthSeconds: the station has
   * timed it out, and the router would reject a response to it. The Call itself is still
   * processed; only the response is not sent.
   */
  private _stationStoppedWaiting(request: IMessage<OcppRequest>): boolean {
    const ageMs = Date.now() - new Date(request.context.timestamp).getTime();
    if (ageMs <= this._config.timeouts.maxCallLengthSeconds * 1000) {
      return false;
    }
    this._logger.info(
      `Not responding to ${request.action} from ${request.context.ocppConnectionName}: the Call ` +
        `arrived ${ageMs} ms ago, past maxCallLengthSeconds. correlationId=${request.context.correlationId}`,
    );
    return true;
  }

  /**
   * Initializes the logger for the class.
   *
   * @return {Logger<ILogObj>} The initialized logger.
   */
  protected _initLogger(baseLogger?: Logger<ILogObj>): Logger<ILogObj> {
    return childLogger(baseLogger, this.constructor.name, () => ({
      ...loggerDefaults(this._config.env),
      minLevel: this._config.logLevel,
    }));
  }
}
