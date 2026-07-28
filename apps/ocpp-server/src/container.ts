// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AwilixContainer } from 'awilix';
import { asClass, asFunction, asValue, createContainer, InjectionMode } from 'awilix';
import type { FastifyInstance } from 'fastify';

// -- Config & Base --
import {
  type BootstrapConfig,
  ConfigStoreFactory,
  type IApiAuthProvider,
  type ICache,
  OcppSender,
  OCPPValidator,
  type SystemConfig,
} from '@citrineos/base';

// -- Infrastructure --
import { type ILogObj, Logger } from 'tslog';

// -- DB --
// -- RabbitMQ --
// -- Repositories --
// -- Services --
// -- API authentication --
// -- Network Connection --
// -- Modules --
// -- Module-internal services (registered by each module package's own registrar) --
// -- Module APIs --
// -- Handlers --
import {
  AdminApi,
  Authenticator,
  BasicAuthenticationFilter,
  BrokerAwareMessageSender,
  CertificateAuthorityService,
  CertificatesDataApi,
  CertificateSignedResponseOcpp2Handler,
  CertificatesModule,
  CertificatesOcpp2Api,
  ClearVariableMonitoringResponseOcpp2Handler,
  Component,
  ConfigurationDataApi,
  ConfigurationModule,
  ConfigurationOcpp16Api,
  ConfigurationOcpp2Api,
  ConnectedStationFilter,
  CustomerInformationResponseOcpp2Handler,
  DefaultSequelizeInstance,
  DeleteCertificateResponseOcpp2Handler,
  DiagnosticsStatusNotificationRequestOcpp16Handler,
  DrizzleSecurityEventRepository,
  EVDriverDataApi,
  EVDriverModule,
  EVDriverOcpp16Api,
  EVDriverOcpp2Api,
  Get15118EVCertificateRequestOcpp2Handler,
  GetBaseReportResponseOcpp2Handler,
  GetCertificateStatusRequestOcpp2Handler,
  GetDiagnosticsResponseOcpp16Handler,
  GetInstalledCertificateIdsResponseOcpp2Handler,
  GetLogResponseOcpp2Handler,
  GetMonitoringReportResponseOcpp2Handler,
  GetReportResponseOcpp2Handler,
  GetVariablesResponseOcpp2Handler,
  IdGenerator,
  InstallCertificateResponseOcpp2Handler,
  InternalSmartCharging,
  LocalBypassAuthProvider,
  LogStatusNotificationRequestOcpp2Handler,
  MessageRouterImpl,
  MonitoringDataApi,
  MonitoringModule,
  MonitoringOcpp2Api,
  NetworkProfileFilter,
  NotifyCustomerInformationRequestOcpp2Handler,
  NotifyEventRequestOcpp2Handler,
  NotifyMonitoringReportRequestOcpp2Handler,
  NotifyReportRequestOcpp2Handler,
  OIDCAuthProvider,
  RabbitMQChannelManager,
  RabbitMQConnectionManager,
  RabbitMqReceiver,
  RabbitMqSender,
  RealTimeAuthorizer,
  registerCertificatesServices,
  registerConfigurationServices,
  registerEVDriverServices,
  registerMonitoringServices,
  registerReportingServices,
  registerTransactionsServices,
  ReportingModule,
  ReportingOcpp16Api,
  ReportingOcpp2Api,
  SecurityEventNotificationRequestOcpp2Handler,
  SequelizeAsyncJobStatusRepository,
  SequelizeAuthorizationRepository,
  SequelizeBootRepository,
  SequelizeCertificateRepository,
  SequelizeChangeConfigurationRepository,
  SequelizeChargingProfileRepository,
  SequelizeChargingStationSecurityInfoRepository,
  SequelizeChargingStationSequenceRepository,
  SequelizeDeleteCertificateAttemptRepository,
  SequelizeDeviceModelRepository,
  SequelizeInstallCertificateAttemptRepository,
  SequelizeInstalledCertificateRepository,
  SequelizeLocalAuthListRepository,
  SequelizeLocationRepository,
  SequelizeMessageInfoRepository,
  SequelizeOCPPMessageRepository,
  SequelizeRepository,
  SequelizeReservationRepository,
  SequelizeSecurityEventRepository,
  SequelizeServerNetworkProfileRepository,
  SequelizeSubscriptionRepository,
  SequelizeTariffRepository,
  SequelizeTenantRepository,
  SequelizeTransactionEventRepository,
  SequelizeVariableMonitoringRepository,
  SetMonitoringBaseResponseOcpp2Handler,
  SetMonitoringLevelResponseOcpp2Handler,
  SetVariableMonitoringResponseOcpp2Handler,
  SetVariablesResponseOcpp2Handler,
  SignCertificateRequestOcpp2Handler,
  SmartChargingModule,
  SmartChargingOcpp16Api,
  SmartChargingOcpp2Api,
  TenantDataApi,
  TenantModule,
  TransactionsDataApi,
  TransactionsModule,
  TransactionsOcpp2Api,
  UnknownStationFilter,
  WebhookDispatcher,
  WebsocketNetworkConnection,
} from '@citrineos/core';

type Prebuilt = {
  logger: Logger<ILogObj>;
  cache: ICache;
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
 * - Modules      → registerModules + registerModuleApis
 *
 * Lifetime model:
 * - asValue: shared constants / prebuilt instances.
 * - singleton: one app-wide instance (repos, services, network stack, the router
 *   and its dedicated routerSender/routerHandler, the broker connection/channel).
 * - scoped: one-per-child-scope. Each module is resolved in its own scope (see
 *   CitrineOSServer.initModuleInScope) together with its sender/handler and APIs,
 *   so they share one instance per module without a singleton→transient leak.
 */
export function buildContainer(config: BootstrapConfig & SystemConfig, prebuilt: Prebuilt) {
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
  registerModuleApis(container);
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
  registerCertificatesServices(container);
  registerConfigurationServices(container);
  registerEVDriverServices(container);
  registerMonitoringServices(container);
  registerReportingServices(container);
  registerTransactionsServices(container);
}

// ============================================================
// Config, primitives & prebuilt infrastructure
// Already-constructed scalars/instances passed straight through as values
// ============================================================
function registerPrimitives(
  container: AwilixContainer,
  config: BootstrapConfig & SystemConfig,
  prebuilt: Prebuilt,
): void {
  const { logger, cache, ocppValidator, server } = prebuilt;

  container.register({
    config: asValue(config),
    fileStorage: asValue(ConfigStoreFactory.getInstance()),
    exchange: asValue(config.util.messageBroker.amqp!.exchange),
    amqpUrl: asValue(config.util.messageBroker.amqp!.url),
    maxCallLengthSeconds: asValue(config.maxCallLengthSeconds),
    maxReconnectDelay: asValue(config.maxReconnectDelay),
    // Consumed by CertificatesDataApi for certificate-chain generation.
    websocketServersConfig: asValue(config.util.networkConnection.websocketServers),
    logger: asValue(logger),
    ocppValidator: asValue(ocppValidator),
    cache: asValue(cache),
    sequelizeInstance: asValue(DefaultSequelizeInstance.getInstance(config, logger)),
    // The Fastify server is shared as a value — module APIs resolve it to register routes.
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
// Each class uses a proxy constructor
// Drizzle security event overrides securityEventRepository.
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
    serverNetworkProfileRepository: asClass(SequelizeServerNetworkProfileRepository).singleton(),
    subscriptionRepository: asClass(SequelizeSubscriptionRepository).singleton(),
    tariffRepository: asClass(SequelizeTariffRepository).singleton(),
    tenantRepository: asClass(SequelizeTenantRepository).singleton(),
    transactionEventRepository: asClass(SequelizeTransactionEventRepository).singleton(),
    variableMonitoringRepository: asClass(SequelizeVariableMonitoringRepository).singleton(),
    componentRepository: asFunction(
      ({ config, logger }) =>
        new SequelizeRepository<Component>({ config, namespace: Component.MODEL_NAME, logger }),
    ).singleton(),
  });

  if (process.env.CITRINEOS_USE_DRIZZLE_SECURITY_EVENT === 'true') {
    container.register({
      securityEventRepository: asFunction(
        ({ config, logger }) => new DrizzleSecurityEventRepository(config, logger),
      ).singleton(),
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
    smartChargingService: asClass(InternalSmartCharging).singleton(),
    realTimeAuthorizer: asClass(RealTimeAuthorizer).singleton(),
    authorizers: asValue([]),
    apiAuthProvider: asFunction(({ config, logger }): IApiAuthProvider => {
      if (config.util.authProvider.oidc) {
        return new OIDCAuthProvider(config.util.authProvider.oidc, logger);
      }
      if (config.util.authProvider.localByPass) {
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

    unknownStationFilter: asClass(UnknownStationFilter).singleton(),
    connectedStationFilter: asClass(ConnectedStationFilter).singleton(),
    networkProfileFilter: asClass(NetworkProfileFilter).singleton(),
    basicAuthenticationFilter: asClass(BasicAuthenticationFilter).singleton(),
    authenticator: asClass(Authenticator).singleton(),
    webhookDispatcher: asClass(WebhookDispatcher).singleton(),
    router: asClass(MessageRouterImpl).singleton(),
    networkConnection: asClass(WebsocketNetworkConnection).singleton(),
    adminApi: asClass(AdminApi).singleton(),
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
function registerModuleApis(container: AwilixContainer): void {
  container.register({
    certificatesOcpp2Api: asClass(CertificatesOcpp2Api).scoped(),
    certificatesDataApi: asClass(CertificatesDataApi).scoped(),
    configurationOcpp2Api: asClass(ConfigurationOcpp2Api).scoped(),
    configurationOcpp16Api: asClass(ConfigurationOcpp16Api).scoped(),
    configurationDataApi: asClass(ConfigurationDataApi).scoped(),
    evDriverOcpp2Api: asClass(EVDriverOcpp2Api).scoped(),
    evDriverOcpp16Api: asClass(EVDriverOcpp16Api).scoped(),
    evDriverDataApi: asClass(EVDriverDataApi).scoped(),
    monitoringOcpp2Api: asClass(MonitoringOcpp2Api).scoped(),
    monitoringDataApi: asClass(MonitoringDataApi).scoped(),
    reportingOcpp2Api: asClass(ReportingOcpp2Api).scoped(),
    reportingOcpp16Api: asClass(ReportingOcpp16Api).scoped(),
    smartChargingOcpp2Api: asClass(SmartChargingOcpp2Api).scoped(),
    smartChargingOcpp16Api: asClass(SmartChargingOcpp16Api).scoped(),
    transactionsOcpp2Api: asClass(TransactionsOcpp2Api).scoped(),
    transactionsDataApi: asClass(TransactionsDataApi).scoped(),
    tenantDataApi: asClass(TenantDataApi).scoped(),
  });
}

// ============================================================
// Handlers — Resolved in the same per-module scope as their module
// ============================================================
function registerHandlers(container: AwilixContainer): void {
  container.register({
    ocppSender: asClass(OcppSender).scoped(),
    // requests
    diagnosticsStatusNotificationRequestOcpp16Handler: asClass(
      DiagnosticsStatusNotificationRequestOcpp16Handler,
    ).scoped(),
    getCertificateStatusRequestOcpp2Handler: asClass(
      GetCertificateStatusRequestOcpp2Handler,
    ).scoped(),
    get15118EVCertificateRequestOcpp2Handler: asClass(
      Get15118EVCertificateRequestOcpp2Handler,
    ).scoped(),
    logStatusNotificationRequestOcpp2Handler: asClass(
      LogStatusNotificationRequestOcpp2Handler,
    ).scoped(),
    notifyCustomerInformationRequestOcpp2Handler: asClass(
      NotifyCustomerInformationRequestOcpp2Handler,
    ).scoped(),
    notifyEventRequestOcpp2Handler: asClass(NotifyEventRequestOcpp2Handler).scoped(),
    notifyMonitoringReportRequestOcpp2Handler: asClass(
      NotifyMonitoringReportRequestOcpp2Handler,
    ).scoped(),
    notifyReportRequestOcpp2Handler: asClass(NotifyReportRequestOcpp2Handler).scoped(),
    signCertificateRequestOcpp2Handler: asClass(SignCertificateRequestOcpp2Handler).scoped(),
    securityEventNotificationRequestOcpp2Handler: asClass(
      SecurityEventNotificationRequestOcpp2Handler,
    ).scoped(),
    // responses
    getDiagnosticsResponseOcpp16Handler: asClass(GetDiagnosticsResponseOcpp16Handler).scoped(),
    certificateSignedResponseOcpp2Handler: asClass(CertificateSignedResponseOcpp2Handler).scoped(),
    clearVariableMonitoringResponseOcpp2Handler: asClass(
      ClearVariableMonitoringResponseOcpp2Handler,
    ).scoped(),
    customerInformationResponseOcpp2Handler: asClass(
      CustomerInformationResponseOcpp2Handler,
    ).scoped(),
    deleteCertificateResponseOcpp2Handler: asClass(DeleteCertificateResponseOcpp2Handler).scoped(),
    getBaseReportResponseOcpp2Handler: asClass(GetBaseReportResponseOcpp2Handler).scoped(),
    getInstalledCertificateIdsResponseOcpp2Handler: asClass(
      GetInstalledCertificateIdsResponseOcpp2Handler,
    ).scoped(),
    getLogResponseOcpp2Handler: asClass(GetLogResponseOcpp2Handler).scoped(),
    getMonitoringReportResponseOcpp2Handler: asClass(
      GetMonitoringReportResponseOcpp2Handler,
    ).scoped(),
    getReportResponseOcpp2Handler: asClass(GetReportResponseOcpp2Handler).scoped(),
    getVariablesResponseOcpp2Handler: asClass(GetVariablesResponseOcpp2Handler).scoped(),
    installCertificateResponseOcpp2Handler: asClass(
      InstallCertificateResponseOcpp2Handler,
    ).scoped(),
    setMonitoringBaseResponseOcpp2Handler: asClass(SetMonitoringBaseResponseOcpp2Handler).scoped(),
    setMonitoringLevelResponseOcpp2Handler: asClass(
      SetMonitoringLevelResponseOcpp2Handler,
    ).scoped(),
    setVariableMonitoringResponseOcpp2Handler: asClass(
      SetVariableMonitoringResponseOcpp2Handler,
    ).scoped(),
    setVariablesResponseOcpp2Handler: asClass(SetVariablesResponseOcpp2Handler).scoped(),
  });
}
