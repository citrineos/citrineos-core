// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractModuleApi, AsDataEndpoint, CallAction, HttpMethod, MessageOrigin, Namespace } from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IAdminApi } from './interface';
import { MessageRouterImpl, Subscription } from './router';

/**
 * Server API for the Certificates module.
 */
export class AdminApi extends AbstractModuleApi<MessageRouterImpl> implements IAdminApi {

  /**
     * Constructs a new instance of the class.
     *
     * @param {MessageRouterImpl} ocppRouter - The OcppRouter module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     */
  constructor(ocppRouter: MessageRouterImpl, server: FastifyInstance, logger?: Logger<ILogObj>) {
    super(ocppRouter, server, logger);
  }

  /**
     * Data endpoints
     */

  @AsDataEndpoint(Namespace.Subscription, HttpMethod.Put)
  async putSubscription(request: FastifyRequest<{ Body: Subscription }>): Promise<void> {
    if (request.body.onConnect) {
      this._module.addOnConnectionCallback(async (identifier: string) => {
        if (identifier === request.body.stationId) {
          return fetch(request.body.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stationId: identifier, event: 'connected' })
          }).then(res => res.status === 200).catch(error => {
            this._logger.error(error);
            return false;
          });
        } else { // Ignore
          return true;
        }
      });
      this._logger.debug(`Added onConnect callback to ${request.body.url} for station ${request.body.stationId}`);
    }
    if (request.body.onClose) {
      this._module.addOnCloseCallback(async (identifier: string) => {
        if (identifier === request.body.stationId) {
          return fetch(request.body.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stationId: identifier, event: 'closed' })
          }).then(res => res.status === 200).catch(error => {
            this._logger.error(error);
            return false;
          });
        } else { // Ignore
          return true;
        }
      });
      this._logger.debug(`Added onClose callback to ${request.body.url} for station ${request.body.stationId}`);
    }
    if (request.body.onMessage) {
      this._module.addOnMessageCallback(async (identifier: string, message: string) => {
        if (identifier === request.body.stationId &&
                    (!request.body.messageOptions?.regexFilter || new RegExp(request.body.messageOptions.regexFilter).test(message))) {
          return fetch(request.body.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stationId: identifier, event: 'message', origin: MessageOrigin.ChargingStation, message: message })
          }).then(res => res.status === 200).catch(error => {
            this._logger.error(error);
            return false;
          });
        } else { // Ignore
          return true;
        }
      });
      this._logger.debug(`Added onMessage callback to ${request.body.url} for station ${request.body.stationId}`);
    }
    if (request.body.sentMessage) {
      this._module.addSentMessageCallback(async (identifier: string, message: string, error?: any) => {
        if (identifier === request.body.stationId &&
                    (!request.body.messageOptions?.regexFilter || new RegExp(request.body.messageOptions.regexFilter).test(message))) {
          return fetch(request.body.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stationId: identifier, event: 'message', origin: MessageOrigin.CentralSystem, message: message, error: error })
          }).then(res => res.status === 200).catch(e => {
            this._logger.error(e);
            return false;
          });
        } else { // Ignore
          return true;
        }
      });
      this._logger.debug(`Added sentMessage callback to ${request.body.url} for station ${request.body.stationId}`);
    }
    return;
  }

  /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = '/ocpprouter';
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix = '/ocpprouter';
    return super._toDataPath(input, endpointPrefix);
  }
}
