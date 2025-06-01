// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModuleApi,
  AsDataEndpoint,
  BadRequestError,
  ConfigStoreFactory,
  DEFAULT_TENANT_ID,
  HttpMethod,
  Namespace,
  NotFoundError,
  OCPP1_6_Namespace,
  OCPP2_0_1_Namespace,
  WebsocketServerConfig,
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IAdminApi } from './interface';
import { MessageRouterImpl } from './router';
import {
  ChargingStationKeyQuerySchema,
  ChargingStationKeyQuerystring,
  CreateSubscriptionSchema,
  ModelKeyQuerystring,
  ModelKeyQuerystringSchema,
  Subscription,
  TenantQueryString,
  TenantQuerySchema,
  WebsocketGetQuerySchema,
  WebsocketGetQuerystring,
} from '@citrineos/data';
import {
  WebsocketDeleteQuerySchema,
  WebsocketDeleteQuerystring,
  WebsocketRequestSchema,
} from '@citrineos/data/dist/interfaces/queries/Websocket';

/**
 * Admin API for the OcppRouter.
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
    super(ocppRouter, server, null, logger);
  }

  // N.B.: When adding subscriptions, chargers may be connected to a different instance of Citrine.
  // If this is the case, new subscriptions will not take effect until the charger reconnects.
  /**
   * Creates a {@link Subscription}.
   * Will always create a new entity and return its id.
   *
   * @param {FastifyRequest<{ Body: Subscription }>} request - The request object, containing the body which is parsed as a {@link Subscription}.
   * @return {Promise<number>} The id of the created subscription.
   */
  @AsDataEndpoint(
    OCPP2_0_1_Namespace.Subscription,
    HttpMethod.Post,
    TenantQuerySchema,
    CreateSubscriptionSchema,
  )
  async postSubscription(
    request: FastifyRequest<{ Body: Subscription; Querystring: TenantQueryString }>,
  ): Promise<number> {
    const tenantId = request.query.tenantId;
    request.body.tenantId = tenantId;
    if (
      !request.body.onClose &&
      !request.body.onConnect &&
      !request.body.onMessage &&
      !request.body.sentMessage
    ) {
      throw new BadRequestError(
        'Must specify at least one of onConnect, onClose, onMessage, sentMessage to true.',
      );
    }
    return this._module.subscriptionRepository
      .create(tenantId, request.body as Subscription)
      .then((subscription) => subscription?.id);
  }

  @AsDataEndpoint(OCPP2_0_1_Namespace.Subscription, HttpMethod.Get, ChargingStationKeyQuerySchema)
  async getSubscriptionsByChargingStation(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<Subscription[]> {
    return this._module.subscriptionRepository.readAllByStationId(
      request.query.tenantId,
      request.query.stationId,
    );
  }

  @AsDataEndpoint(OCPP2_0_1_Namespace.Subscription, HttpMethod.Delete, ModelKeyQuerystringSchema)
  async deleteSubscriptionById(
    request: FastifyRequest<{ Querystring: ModelKeyQuerystring }>,
  ): Promise<boolean> {
    const tenantId = request.query.tenantId ?? DEFAULT_TENANT_ID;
    return this._module.subscriptionRepository
      .deleteByKey(tenantId, request.query.id.toString())
      .then(() => true);
  }

  @AsDataEndpoint(Namespace.Websocket, HttpMethod.Get, WebsocketGetQuerySchema)
  async getWebsocketConfigurations(
    request: FastifyRequest<{ Querystring: WebsocketGetQuerystring }>,
  ): Promise<WebsocketServerConfig[] | WebsocketServerConfig> {
    if (request.query.id) {
      const websocketConfig = this._module.config.util.networkConnection.websocketServers.find(
        (ws) => ws.id === request.query.id,
      );

      if (!websocketConfig) {
        throw new NotFoundError(
          `Could not find websocket configuration with id ${request.query.id}`,
        );
      } else {
        return websocketConfig;
      }
    } else {
      // TODO when available (coming soon in a separate feature), filter by tenantId if the tenantId query param exists
      return this._module.config.util.networkConnection.websocketServers;
    }
  }

  @AsDataEndpoint(Namespace.Websocket, HttpMethod.Post, undefined, WebsocketRequestSchema)
  async createWebsocketConfiguration(
    request: FastifyRequest<{ Body: WebsocketServerConfig }>,
  ): Promise<WebsocketServerConfig> {
    const existingConfig = this._module.config.util.networkConnection.websocketServers.find(
      (ws) => ws.id === request.body.id,
    );

    if (existingConfig) {
      throw new BadRequestError(
        `Websocket configuration with id ${request.body.id} already exists.`,
      );
    } else {
      this._module.config.util.networkConnection.websocketServers.push(request.body);
      await ConfigStoreFactory.getInstance().saveConfig(this._module.config);
      return request.body;
    }
  }

  @AsDataEndpoint(Namespace.Websocket, HttpMethod.Delete, WebsocketDeleteQuerySchema)
  async deleteWebsocketConfiguration(
    request: FastifyRequest<{ Querystring: WebsocketDeleteQuerystring }>,
  ): Promise<void> {
    const existingConfigIndex =
      this._module.config.util.networkConnection.websocketServers.findIndex(
        (ws) => ws.id === request.query.id,
      );

    if (existingConfigIndex) {
      this._module.config.util.networkConnection.websocketServers.splice(existingConfigIndex, 1);
      await ConfigStoreFactory.getInstance().saveConfig(this._module.config);
    }
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = '/ocpprouter';
    return super._toDataPath(input, endpointPrefix);
  }
}
