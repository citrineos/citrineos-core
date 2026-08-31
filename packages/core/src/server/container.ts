// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AwilixContainer } from 'awilix';
import { asClass, asFunction, asValue, createContainer, InjectionMode } from 'awilix';
import type { FastifyInstance } from 'fastify';

// -- Config & Base --
import {
  type IApiAuthProvider,
  type ICache,
  type IFileStorage,
  OcppSender,
  OCPPValidator,
} from '@citrineos/base';
import { type SystemConfig, type TenantDto } from '@citrineos/types';

// -- Infrastructure --
import { type ILogObj, Logger } from 'tslog';

// -- Core: DB, messaging, repositories, services, network, modules, APIs, handlers --
import {
  DefaultDrizzleInstance,
  DefaultSequelizeInstance,
  DrizzleAuthorizationRepository,
  DrizzleBootRepository,
  DrizzleCertificateRepository,
  DrizzleDeleteCertificateAttemptRepository,
  DrizzleInstallCertificateAttemptRepository,
  DrizzleSecurityEventRepository,
  DrizzleServerNetworkProfileRepository,
  DrizzleSubscriptionRepository,
  DrizzleTenantRepository,
  DrizzleVariableAttributeRepository,
  SequelizeAsyncJobStatusRepository,
  SequelizeAuthorizationRepository,
  SequelizeBootRepository,
  SequelizeCertificateRepository,
  SequelizeChangeConfigurationRepository,
  SequelizeChargingProfileRepository,
  SequelizeChargingStationNetworkProfileRepository,
  SequelizeChargingStationSecurityInfoRepository,
  SequelizeChargingStationSequenceRepository,
  SequelizeComponentRepository,
  SequelizeDeleteCertificateAttemptRepository,
  SequelizeDeviceModelRepository,
  SequelizeInstallCertificateAttemptRepository,
  SequelizeInstalledCertificateRepository,
  SequelizeLocalAuthListRepository,
  SequelizeLocationRepository,
  SequelizeMessageInfoRepository,
  SequelizeOCPPMessageRepository,
  SequelizeReservationRepository,
  SequelizeSecurityEventRepository,
  SequelizeServerNetworkProfileRepository,
  SequelizeSetNetworkProfileRepository,
  SequelizeSubscriptionRepository,
  SequelizeTariffRepository,
  SequelizeTenantRepository,
  SequelizeTransactionEventRepository,
  SequelizeVariableMonitoringRepository,
} from '@dal/index.js';
import { CommandsApi } from '@modules/Api/src/module/CommandsApi.js';
import { OcppMessageApi } from '@modules/Api/src/module/OcppMessageApi.js';
import { WebPaymentApi } from '@modules/Api/src/module/WebPaymentApi.js';
import { registerApiServices } from '@modules/Api/src/register.js';
import {
  CertificatesModule,
  registerCertificatesServices,
} from '@modules/Certificates/src/index.js';
import {
  ConfigurationModule,
  registerConfigurationServices,
} from '@modules/Configuration/src/index.js';
import { EVDriverModule, registerEVDriverServices } from '@modules/EVDriver/src/index.js';
import { MonitoringModule, registerMonitoringServices } from '@modules/Monitoring/src/index.js';
import {
  AdminApi,
  MessageRouterImpl,
  registerOcppRouterServices,
  WebhookDispatcher,
} from '@modules/OcppRouter/src/index.js';
import { registerReportingServices, ReportingModule } from '@modules/Reporting/src/index.js';
import {
  InternalSmartCharging,
  registerSmartChargingServices,
  SmartChargingModule,
} from '@modules/SmartCharging/src/index.js';
import { TenantModule } from '@modules/Tenant/src/index.js';
import {
  registerTransactionsServices,
  TransactionsModule,
} from '@modules/Transactions/src/index.js';
import {
  Authenticator,
  BasicAuthenticationFilter,
  BrokerAwareMessageSender,
  CertificateAuthorityService,
  ConnectedStationFilter,
  DeviceModelService,
  IdGenerator,
  LocalBypassAuthProvider,
  NetworkProfileFilter,
  NetworkProfileService,
  OIDCAuthProvider,
  RabbitMQChannelManager,
  RabbitMQConnectionManager,
  RabbitMqReceiver,
  RabbitMqSender,
  RealTimeAuthorizer,
  UnknownStationFilter,
  WebsocketNetworkConnection,
} from '@util/index.js';

export type Prebuilt = {
  logger: Logger<ILogObj>;
  cache: ICache;
  fileStorage: IFileStorage;
  ocppValidator: OCPPValidator;
  server: FastifyInstance;
};

/**
 * Builds the application's Awilix container.
 *
 * Registration is split into per-layer registrar functions
 *
 * - System Config → registerPrimitives
 * - DB           → registerPrimitives (sequelizeInstance)
 * - RabbitMQ     → registerMessaging
 * - Repositories → registerRepositories
 * - Services     → registerServices (incl. apiAuthProvider) + registerModuleServices
 *                  (each module package's own register<Module>Services) + registerNetwork (adminApi)
 * - Modules      → registerModules
 *
 * Lifetime model:
 * - asValue: shared constants / prebuilt instances.
 * - singleton: one app-wide instance (repos, services, network stack, the router
 *   and its dedicated routerSender/routerHandler, the broker connection/channel).
 * - scoped: one-per-child-scope. Each module is resolved in its own scope (see
 *   CitrineOSServer.initModuleInScope) together with its sender/handler, and the
 *   API unit in its own (CitrineOSServer.initApiInScope) together with its
 *   endpoints, so they share one instance per scope without a singleton→transient leak.
 */
export function buildContainer(config: SystemConfig, prebuilt: Prebuilt) {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  registerPrimitives(container, config, prebuilt);
  registerMessaging(container);
  registerRepositories(container);
  registerServices(container);
  registerModuleServices(container);
  registerNetwork(container);
  registerModules(container);
  registerApis(container);
  registerHandlers(container);

  return container;
}

// ============================================================
// Module-internal services in scope. Each module package owns the wiring of its
// own services via a register<Module>Services(container) function;
// The service classes stay private to their packages.
// Resolved per-module-scope alongside the module itself.
// ============================================================
function registerModuleServices(container: AwilixContainer): void {
  registerApiServices(container);
  registerCertificatesServices(container);
  registerConfigurationServices(container);
  registerEVDriverServices(container);
  registerMonitoringServices(container);
  registerOcppRouterServices(container);
  registerReportingServices(container);
  registerSmartChargingServices(container);
  registerTransactionsServices(container);
}

// ============================================================
// Config, primitives & prebuilt infrastructure
// Already-constructed scalars/instances passed straight through as values
// ============================================================
function registerPrimitives(
  container: AwilixContainer,
  config: SystemConfig,
  prebuilt: Prebuilt,
): void {
  const { logger, cache, fileStorage, ocppValidator, server } = prebuilt;

  container.register({
    config: asValue(config),
    fileStorage: asValue(fileStorage),
    exchange: asValue(config.messageBroker.amqp!.exchange),
    amqpUrl: asValue(config.messageBroker.amqp!.url),
    maxCallLengthSeconds: asValue(config.timeouts.maxCallLengthSeconds),
    maxReconnectDelay: asValue(config.messageBroker.amqp!.maxReconnectDelaySeconds),
    logger: asValue(logger),
    ocppValidator: asValue(ocppValidator),
    cache: asValue(cache),
    sequelizeInstance: asValue(DefaultSequelizeInstance.getInstance(config, logger)),
    // The Fastify server is shared as a value — the API classes resolve it to register routes.
    server: asValue(server),
  });
}

// ============================================================
// RabbitMQ messaging
// sender + handler: each per-module child scope gets its own pair
// routerSender + routerHandler: dedicated singleton pair for the singleton MessageRouterImpl.
// sender/routerSender are a BrokerAwareMessageSender wrapping a RabbitMqSender.
// ============================================================
function registerMessaging(container: AwilixContainer): void {
  container.register({
    connectionManager: asClass(RabbitMQConnectionManager).singleton(),
    channelManager: asClass(RabbitMQChannelManager).singleton(),
  });

  // This is the message bus per module. Set to be scoped to each specific instance.
  container.register({
    sender: asFunction(
      ({ exchange, connectionManager, channelManager, logger, maxCallLengthSeconds }) =>
        new BrokerAwareMessageSender(
          new RabbitMqSender(exchange, connectionManager, channelManager, logger),
          connectionManager,
          maxCallLengthSeconds,
          logger,
        ),
    ).scoped(),

    handler: asFunction(
      ({ config, channelManager, logger }) =>
        new RabbitMqReceiver({ config, channelManager, logger }),
    ).scoped(),
  });

  // This is the routing messenger between the charging stations and the message bus
  container.register({
    routerSender: asFunction(
      ({ exchange, connectionManager, channelManager, logger, maxCallLengthSeconds }) =>
        new BrokerAwareMessageSender(
          new RabbitMqSender(exchange, connectionManager, channelManager, logger),
          connectionManager,
          maxCallLengthSeconds,
          logger,
        ),
    ).singleton(),
    routerHandler: asFunction(
      ({ config, channelManager, logger }) =>
        new RabbitMqReceiver({ config, channelManager, logger }),
    ).singleton(),
  });
}

// ============================================================
// Repositories — all singletons, registered from @citrineos/core named exports.
// Every repository class takes a single destructured dependency object, which is
// what PROXY injection hands it, so all of them register with asClass.
// The Drizzle repositories override their Sequelize counterparts when enabled.
// ============================================================
function registerRepositories(container: AwilixContainer): void {
  container.register({
    asyncJobStatusRepository: asClass(SequelizeAsyncJobStatusRepository).singleton(),
    authorizationRepository: asClass(SequelizeAuthorizationRepository).singleton(),
    bootRepository: asClass(SequelizeBootRepository).singleton(),
    certificateRepository: asClass(SequelizeCertificateRepository).singleton(),
    changeConfigurationRepository: asClass(SequelizeChangeConfigurationRepository).singleton(),
    chargingProfileRepository: asClass(SequelizeChargingProfileRepository).singleton(),
    chargingStationSecurityInfoRepository: asClass(
      SequelizeChargingStationSecurityInfoRepository,
    ).singleton(),
    chargingStationSequenceRepository: asClass(
      SequelizeChargingStationSequenceRepository,
    ).singleton(),
    deleteCertificateAttemptRepository: asClass(
      SequelizeDeleteCertificateAttemptRepository,
    ).singleton(),
    deviceModelRepository: asClass(SequelizeDeviceModelRepository).singleton(),
    installCertificateAttemptRepository: asClass(
      SequelizeInstallCertificateAttemptRepository,
    ).singleton(),
    installedCertificateRepository: asClass(SequelizeInstalledCertificateRepository).singleton(),
    localAuthListRepository: asClass(SequelizeLocalAuthListRepository).singleton(),
    locationRepository: asClass(SequelizeLocationRepository).singleton(),
    messageInfoRepository: asClass(SequelizeMessageInfoRepository).singleton(),
    ocppMessageRepository: asClass(SequelizeOCPPMessageRepository).singleton(),
    reservationRepository: asClass(SequelizeReservationRepository).singleton(),
    securityEventRepository: asClass(SequelizeSecurityEventRepository).singleton(),
    chargingStationNetworkProfileRepository: asClass(
      SequelizeChargingStationNetworkProfileRepository,
    ).singleton(),
    serverNetworkProfileRepository: asClass(SequelizeServerNetworkProfileRepository).singleton(),
    setNetworkProfileRepository: asClass(SequelizeSetNetworkProfileRepository).singleton(),
    subscriptionRepository: asClass(SequelizeSubscriptionRepository).singleton(),
    tariffRepository: asClass(SequelizeTariffRepository).singleton(),
    tenantRepository: asClass(SequelizeTenantRepository).singleton(),
    transactionEventRepository: asClass(SequelizeTransactionEventRepository).singleton(),
    variableMonitoringRepository: asClass(SequelizeVariableMonitoringRepository).singleton(),
    componentRepository: asClass(SequelizeComponentRepository).singleton(),
  });

  if (process.env.CITRINEOS_USE_DRIZZLE === 'true') {
    container.register({
      drizzleInstance: asFunction(({ config, logger }) =>
        DefaultDrizzleInstance.getInstance(config, logger),
      ).singleton(),

      useTenantSchema: asValue(false),

      authorizationRepository: asClass(DrizzleAuthorizationRepository).singleton(),
      bootRepository: asClass(DrizzleBootRepository).singleton(),
      certificateRepository: asClass(DrizzleCertificateRepository).singleton(),
      deleteCertificateAttemptRepository: asClass(
        DrizzleDeleteCertificateAttemptRepository,
      ).singleton(),
      installCertificateAttemptRepository: asClass(
        DrizzleInstallCertificateAttemptRepository,
      ).singleton(),
      securityEventRepository: asClass(DrizzleSecurityEventRepository).singleton(),
      subscriptionRepository: asClass(DrizzleSubscriptionRepository).singleton(),
      serverNetworkProfileRepository: asClass(DrizzleServerNetworkProfileRepository).singleton(),
      tenantRepository: asClass(DrizzleTenantRepository).singleton(),
      variableAttributeRepository: asClass(DrizzleVariableAttributeRepository).singleton(),
    });
  }
}

// ============================================================
// Services — all singletons; depend on repos and config.
// authorizers: potential additional authorizers consumed by EVDriverModule and TransactionsModule.
// apiAuthProvider: HTTP API auth — OIDC or local-bypass selected per config
// ============================================================
function registerServices(container: AwilixContainer): void {
  container.register({
    idGenerator: asClass(IdGenerator).singleton(),
    certificateAuthorityService: asClass(CertificateAuthorityService).singleton(),
    deviceModelService: asClass(DeviceModelService).singleton(),
    networkProfileService: asClass(NetworkProfileService).singleton(),
    smartChargingService: asClass(InternalSmartCharging).singleton(),
    realTimeAuthorizer: asClass(RealTimeAuthorizer).singleton(),
    authorizers: asValue([]),
    apiAuthProvider: asFunction(({ config, logger }): IApiAuthProvider => {
      const oidc = (config as SystemConfig).auth.oidc;
      if (oidc) {
        const { cacheTimeSeconds, ...rest } = oidc;
        return new OIDCAuthProvider(
          { ...rest, ...(cacheTimeSeconds && { cacheTime: cacheTimeSeconds * 1000 }) },
          logger,
        );
      }
      if ((config as SystemConfig).auth.localBypass) {
        return new LocalBypassAuthProvider(logger);
      }
      throw new Error('No valid API authentication provider configured');
    }).singleton(),
  });
}

// ============================================================
// Network connection
// ============================================================
function registerNetwork(container: AwilixContainer): void {
  container.register({
    networkHook: asValue(async (_identifier: string, _message: string) => {}),

    doesChargingStationExistByStationId: asFunction(
      ({ locationRepository }) =>
        (tenantId: number, ocppConnectionName: string): Promise<boolean> =>
          locationRepository.doesChargingStationExistByStationId(tenantId, ocppConnectionName),
    ).singleton(),
    getMaxChargingStationsForTenant: asFunction(
      ({ tenantRepository }) =>
        async (tenantId: number): Promise<number | null> => {
          const tenant = await tenantRepository.readByKey(tenantId, tenantId);
          return tenant?.maxChargingStations ?? null;
        },
    ).singleton(),
    // Tenant path resolution for websocket servers with dynamicTenantResolution enabled:
    // one lookup per unknown path (cache miss), plus a bulk load to warm the cache on startup.
    getTenantIdByWebsocketServerPath: asFunction(
      ({ tenantRepository }) =>
        async (path: string): Promise<number | undefined> => {
          const tenant = await tenantRepository.readByWebsocketServerPath(path);
          return tenant?.id;
        },
    ).singleton(),
    getAllTenantWebsocketServerPaths: asFunction(
      ({ tenantRepository }) =>
        async (): Promise<Map<string, number>> => {
          const tenants = await tenantRepository.readAllWithWebsocketServerPath();
          return new Map(
            tenants
              .filter((tenant: TenantDto) => tenant.tenantWebsocketServerPath && tenant.id)
              .map((tenant: TenantDto): [string, number] => [
                tenant.tenantWebsocketServerPath!,
                tenant.id!,
              ]),
          );
        },
    ).singleton(),

    unknownStationFilter: asClass(UnknownStationFilter).singleton(),
    connectedStationFilter: asClass(ConnectedStationFilter).singleton(),
    networkProfileFilter: asClass(NetworkProfileFilter).singleton(),
    basicAuthenticationFilter: asClass(BasicAuthenticationFilter).singleton(),
    authenticator: asClass(Authenticator).singleton(),
    webhookDispatcher: asClass(WebhookDispatcher).singleton(),
    router: asClass(MessageRouterImpl).singleton(),
    networkConnection: asClass(WebsocketNetworkConnection).singleton(),
    adminApi: asClass(AdminApi).scoped(),
  });
}

// ============================================================
// Modules — Resolved once per per-module child scope
// ============================================================
function registerModules(container: AwilixContainer): void {
  container.register({
    certificatesModule: asClass(CertificatesModule).scoped(),
    configurationModule: asClass(ConfigurationModule).scoped(),
    evDriverModule: asClass(EVDriverModule).scoped(),
    monitoringModule: asClass(MonitoringModule).scoped(),
    reportingModule: asClass(ReportingModule).scoped(),
    smartChargingModule: asClass(SmartChargingModule).scoped(),
    transactionsModule: asClass(TransactionsModule).scoped(),
    tenantModule: asClass(TenantModule).scoped(),
  });
}

// ============================================================
// Module APIs — Resolved in the same per-module scope as their module
// ============================================================
function registerApis(container: AwilixContainer): void {
  container.register({
    commandsApi: asClass(CommandsApi).scoped(),
    ocppMessageApi: asClass(OcppMessageApi).scoped(),
    webPaymentApi: asClass(WebPaymentApi).scoped(),
  });
}

// ============================================================
// Handlers — Resolved in the same per-module scope as their module
// ============================================================
function registerHandlers(container: AwilixContainer): void {
  container.register({
    ocppSender: asClass(OcppSender).scoped(),
  });
}
