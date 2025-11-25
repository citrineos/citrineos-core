// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BootstrapConfig,
  IMessageRouter,
  INetworkConnection,
  SystemConfig,
  WebsocketServerConfig,
} from '@citrineos/base';
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
  OCPPVersion,
} from '@citrineos/base';
import type {
  ChargingStationKeyQuerystring,
  ConnectionDeleteQuerystring,
  IServerNetworkProfileRepository,
  ISubscriptionRepository,
  ModelKeyQuerystring,
  TenantQueryString,
  WebsocketDeleteQuerystring,
  WebsocketGetQuerystring,
} from '@citrineos/data';
import {
  ChargingStationKeyQuerySchema,
  ConnectionDeleteQuerySchema,
  CreateSubscriptionSchema,
  ModelKeyQuerystringSchema,
  sequelize,
  Subscription,
  TenantQuerySchema,
  WebsocketDeleteQuerySchema,
  WebsocketGetQuerySchema,
  WebsocketRequestSchema,
} from '@citrineos/data';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IAdminApi } from './interface.js';

/**
 * Admin API for the OcppRouter.
 */
export class AdminApi extends AbstractModuleApi<IMessageRouter> implements IAdminApi {
  private _networkConnection: INetworkConnection;
  private _subscriptionRepository: ISubscriptionRepository;
  private _serverNetworkProfileRepository: IServerNetworkProfileRepository;

  /**
   * Constructs a new instance of the class.
   *
   * @param {IMessageRouter} ocppRouter - The OcppRouter module.
   * @param {INetworkConnection} networkConnection - The network connection instance.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {BootstrapConfig & SystemConfig} config - The configuration instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   * @param {ISubscriptionRepository} [subscriptionRepository] - The subscription repository instance.
   * @param {IServerNetworkProfileRepository} [serverNetworkProfileRepository] - The server network profile repository instance.
   */
  constructor(
    ocppRouter: IMessageRouter,
    networkConnection: INetworkConnection,
    server: FastifyInstance,
    config: BootstrapConfig & SystemConfig,
    logger?: Logger<ILogObj>,
    subscriptionRepository?: ISubscriptionRepository,
    serverNetworkProfileRepository?: IServerNetworkProfileRepository,
  ) {
    super(ocppRouter, server, null, logger);
    this._networkConnection = networkConnection;
    this._subscriptionRepository =
      subscriptionRepository || new sequelize.SequelizeSubscriptionRepository(config, this._logger);
    this._serverNetworkProfileRepository =
      serverNetworkProfileRepository ||
      new sequelize.SequelizeServerNetworkProfileRepository(config, this._logger);
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
    return this._subscriptionRepository
      .create(tenantId, request.body as Subscription)
      .then((subscription) => subscription?.id);
  }

  @AsDataEndpoint(OCPP2_0_1_Namespace.Subscription, HttpMethod.Get, ChargingStationKeyQuerySchema)
  async getSubscriptionsByChargingStation(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<Subscription[]> {
    return this._subscriptionRepository.readAllByStationId(
      request.query.tenantId,
      request.query.stationId,
    );
  }

  @AsDataEndpoint(OCPP2_0_1_Namespace.Subscription, HttpMethod.Delete, ModelKeyQuerystringSchema)
  async deleteSubscriptionById(
    request: FastifyRequest<{ Querystring: ModelKeyQuerystring }>,
  ): Promise<boolean> {
    const tenantId = request.query.tenantId ?? DEFAULT_TENANT_ID;
    return this._subscriptionRepository
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

  /**
   * Add new websocket servers for the tenant without restarting the service.
   */
  @AsDataEndpoint(Namespace.Websocket, HttpMethod.Put, TenantQuerySchema)
  async addWebsocketConfigurationsForTenant(
    request: FastifyRequest<{ Body: { tenantId: number }; Querystring: TenantQueryString }>,
  ): Promise<WebsocketServerConfig[]> {
    const existingConfig = this._module.config.util.networkConnection.websocketServers.find(
      (ws) => ws.tenantId === request.body.tenantId,
    );

    if (existingConfig) {
      throw new BadRequestError(
        `Websocket configurations for tenant ${request.body.tenantId} already exists.`,
      );
    } else {
      // 1. find the max port and max server id in the existing ws configs
      const maxPort: number = this._module.config.util.networkConnection.websocketServers.reduce(
        (max, ws) => Math.max(max, ws.port),
        10000, // the stating value for dynamic ports
      );
      if (maxPort > 10500) {
        throw new BadRequestError('Cannot create new websocket server: maximum port 9000 reached.');
      }

      const maxServerId: number =
        this._module.config.util.networkConnection.websocketServers.reduce(
          (max, ws) => Math.max(max, Number(ws.id)),
          0,
        );
      // 2. create new ws servers, one for profile 0 and one for profile 1
      const newServerForProfile0: WebsocketServerConfig = await this._createNewWebsocketServer(
        request.body.tenantId,
        maxPort + 1,
        maxServerId + 1,
        0,
        true,
        this._module.config.util.networkConnection.websocketServers[0],
      );
      const newServerForProfile1: WebsocketServerConfig = await this._createNewWebsocketServer(
        request.body.tenantId,
        maxPort + 2,
        maxServerId + 2,
        1,
        false,
        this._module.config.util.networkConnection.websocketServers[0],
      );

      // 3. Save the updated configs in the file store
      await ConfigStoreFactory.getInstance().saveConfig(this._module.config);

      return [newServerForProfile0, newServerForProfile1];
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

  // Forcibly disconnect a websocket connection by station id and tenant id and mark the station as offline
  @AsDataEndpoint(Namespace.Connection, HttpMethod.Delete, ConnectionDeleteQuerySchema)
  async deleteWebsocketConnection(
    request: FastifyRequest<{ Querystring: ConnectionDeleteQuerystring }>,
  ): Promise<void> {
    await this._networkConnection.disconnect(request.query.tenantId, request.query.stationId);
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

  private async _createNewWebsocketServer(
    tenantId: number,
    port: number,
    serverId: number,
    securityProfile: number,
    allowUnknownChargingStations: boolean,
    existingServerConfig: WebsocketServerConfig,
  ): Promise<WebsocketServerConfig> {
    const newServerConfig: WebsocketServerConfig = {
      id: serverId.toString(),
      host: existingServerConfig.host,
      port,
      pingInterval: existingServerConfig.pingInterval,
      protocol: OCPPVersion.OCPP2_0_1,
      securityProfile,
      tenantId,
      allowUnknownChargingStations,
    };

    // save new config in db
    await this._serverNetworkProfileRepository.upsertServerNetworkProfile(
      newServerConfig,
      this._module.config.maxCallLengthSeconds,
    );
    // start the new ws server
    await this._networkConnection.addWebsocketServer(newServerConfig);
    // add the new ws server to the config
    this._module.config.util.networkConnection.websocketServers.push(newServerConfig);

    return newServerConfig;
  }
}
