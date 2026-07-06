// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AwilixContainer } from 'awilix';
import { buildContainer } from './container.js';
import type {
  AbstractModule,
  BootstrapConfig,
  IApiAuthProvider,
  ICache,
  IFileStorage,
  IMessageRouter,
  IModule,
  IModuleApi,
  SystemConfig,
} from '@citrineos/base';
import {
  Ajv,
  ConfigStoreFactory,
  EventGroup,
  eventGroupFromString,
  type IAuthenticator,
  OCPPValidator,
} from '@citrineos/base';
import {
  AdminApi,
  apiAuthPluginFp,
  BrokerAwareMessageSender,
  DefaultDrizzleInstance,
  initSwagger,
  type IServerNetworkProfileRepository,
  MemoryCache,
  RabbitMQChannelManager,
  RabbitMQConnectionManager,
  RedisCache,
  sequelize,
  Sequelize,
  WebsocketNetworkConnection,
} from '@citrineos/core';
import cors from '@fastify/cors';
import { type JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import type { FastifyInstance, FastifyReply } from 'fastify';
import fastify from 'fastify';
import type {
  FastifyRouteSchemaDef,
  FastifySchemaCompiler,
  FastifyValidationResult,
} from 'fastify/types/schema.js';
import type { RedisClientOptions } from 'redis';
import { type ILogObj, Logger } from 'tslog';
import { type HealthCheckResult, HealthCheckService } from './health/HealthCheckService.js';

/** The container tokens needed to initialize a module and its APIs in a scope. */
interface ModuleInitSpec {
  moduleToken: string;
  routeApis: string[];
  configKey: keyof (BootstrapConfig & SystemConfig)['modules'];
}

export class CitrineOSServer {
  /**
   * Fields
   */
  protected readonly _config: BootstrapConfig & SystemConfig;
  protected readonly _logger: Logger<ILogObj>;
  protected readonly _server: FastifyInstance;
  protected readonly _cache: ICache;
  protected readonly _ajv: Ajv.Ajv;
  protected readonly _ocppValidator: OCPPValidator;
  protected readonly _fileStorage: IFileStorage;
  protected readonly modules: IModule[] = [];
  protected readonly apis: IModuleApi[] = [];
  protected _sequelizeInstance!: Sequelize;
  protected host?: string;
  protected port?: number;
  protected eventGroup?: EventGroup;
  protected _authenticator?: IAuthenticator;
  protected _router?: IMessageRouter;
  protected _networkConnection?: WebsocketNetworkConnection;

  protected readonly appName: string;
  protected _isShuttingDown = false;
  protected _container!: AwilixContainer;
  protected _connectionManager?: RabbitMQConnectionManager;
  protected _channelManager?: RabbitMQChannelManager;
  protected _healthCheckService?: HealthCheckService;

  // Single source of truth mapping each module's EventGroup to the container
  // tokens + config flag needed to initialize it. initAllModules() and
  // initModule() both read from this instead of repeating the mapping.
  private static readonly MODULE_SPECS: Partial<Record<EventGroup, ModuleInitSpec>> = {
    [EventGroup.Certificates]: {
      moduleToken: 'certificatesModule',
      routeApis: ['certificatesOcpp2Api', 'certificatesDataApi'],
      configKey: 'certificates',
    },
    [EventGroup.Configuration]: {
      moduleToken: 'configurationModule',
      routeApis: ['configurationOcpp2Api', 'configurationOcpp16Api', 'configurationDataApi'],
      configKey: 'configuration',
    },
    [EventGroup.EVDriver]: {
      moduleToken: 'evDriverModule',
      routeApis: ['evDriverOcpp2Api', 'evDriverOcpp16Api', 'evDriverDataApi'],
      configKey: 'evdriver',
    },
    [EventGroup.Monitoring]: {
      moduleToken: 'monitoringModule',
      routeApis: ['monitoringOcpp2Api', 'monitoringDataApi'],
      configKey: 'monitoring',
    },
    [EventGroup.Reporting]: {
      moduleToken: 'reportingModule',
      routeApis: ['reportingOcpp2Api', 'reportingOcpp16Api'],
      configKey: 'reporting',
    },
    [EventGroup.SmartCharging]: {
      moduleToken: 'smartChargingModule',
      routeApis: ['smartChargingOcpp2Api', 'smartChargingOcpp16Api'],
      configKey: 'smartcharging',
    },
    [EventGroup.Transactions]: {
      moduleToken: 'transactionsModule',
      routeApis: ['transactionsOcpp2Api', 'transactionsDataApi'],
      configKey: 'transactions',
    },
    [EventGroup.Tenant]: {
      moduleToken: 'tenantModule',
      routeApis: ['tenantDataApi'],
      configKey: 'tenant',
    },
  };

  // todo rename event group to type
  constructor(
    appName: string,
    bootstrapConfig: BootstrapConfig,
    systemConfig: SystemConfig,
    server?: FastifyInstance,
    ajv?: Ajv.Ajv,
    cache?: ICache,
  ) {
    // TODO: Create and export config schemas for each util module, such as amqp, redis, etc, to avoid passing them possibly invalid configuration
    if (!systemConfig.util.messageBroker.amqp) {
      throw new Error('This server implementation requires amqp configuration for rabbitMQ.');
    }

    // Create the prebuilt primitives the container depends on, then build it.
    this.appName = appName;
    this._config = { ...bootstrapConfig, ...systemConfig };
    this._server = server || fastify().withTypeProvider<JsonSchemaToTsProvider>();

    // enable cors
    this._server.register(cors, {
      origin: true, // This can be customized to specify allowed origins
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed HTTP methods
    });

    console.log('Bootstrap configuration loaded');

    // Create Ajv JSON schema validator instance
    this._ajv = OCPPValidator.createServerAjvInstance(ajv);

    // Initialize parent logger
    this._logger = this.initLogger();

    // Create a separate OCPPValidator with its own Ajv instance for OCPP message validation.
    // This must be distinct from _ajv: OCPP messages are parsed JSON (no coercion needed),
    // whereas _ajv coerces types for Fastify's HTTP schema compilation.
    this._ocppValidator = new OCPPValidator(this._logger);

    // Set cache implementation
    this._cache = this.initCache(cache);

    // Initialize File Access Implementation
    this._fileStorage = ConfigStoreFactory.getInstance();

    // Build the DI container from the prebuilt primitives. Everything else is
    // resolved from / wired through it in initialize().
    this._container = buildContainer(this._config, {
      logger: this._logger,
      cache: this._cache,
      ocppValidator: this._ocppValidator,
      server: this._server,
    });
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      await this._syncWebsocketConfig();
      await this._server
        .listen({
          host: this.host,
          port: this.port,
        })
        .then((address) => {
          this._logger?.info(`Server listening at ${address}`);
        })
        .catch((error) => {
          this._logger?.error(error);
          process.exit(1);
        });
      // TODO Push config to microservices
    } catch (error) {
      this._logger?.error('Fatal error during startup', error);
      throw error;
    }
  }

  // Wire everything that depends on the container, as an ordered sequence.
  async initialize(): Promise<void> {
    await this.registerHttpPlugins();
    this.initSequelizeInstance();
    await this.initMessageBrokerConnection();
    await this.initSystem();
    await this.initDb();
    this.initHealthCheckService();
    this.registerShutdownHandlers();
  }

  async shutdown() {
    if (this._isShuttingDown) return;
    this._isShuttingDown = true;
    this._logger.info('Shutdown initiated');
    this._healthCheckService?.shutdown();

    const forceExit = setTimeout(() => {
      console.log('Shutdown timed out, forcing exit');
      process.exit(1);
    }, this._config.shutdownGracePeriodSeconds * 1000); // Default is 30 seconds
    forceExit.unref();

    this._logger.info('Closing HTTP server...');
    await new Promise<void>((resolve, reject) => {
      try {
        this._server.close(() => resolve());
      } catch (error) {
        reject(error);
      }
    });
    this._logger.info('Closing WebSocket servers...');
    await this._networkConnection?.shutdown();

    this._logger.info('Closing RabbitMQ connections...');
    await this._channelManager?.closeAll();
    await this._connectionManager?.close();

    this._logger.info('Closing PostgreSQL connections...');
    await this._sequelizeInstance.connectionManager.close();

    this._logger.info('Shutdown complete');
    process.exitCode = 0;
  }

  protected initLogger() {
    const isCloud = process.env.DEPLOYMENT_TARGET === 'cloud';

    const loggerSettings = {
      name: 'CitrineOS Logger',
      minLevel: this._config.logLevel,
      hideLogPositionForProduction: this._config.env === 'production',
      type: isCloud ? ('json' as const) : ('pretty' as const),
    };

    return new Logger<ILogObj>(loggerSettings);
  }

  protected initCache(cache?: ICache): ICache {
    if (cache) return cache;
    if (this._config.util.cache.redis) {
      const redisClientOptions: RedisClientOptions =
        'url' in this._config.util.cache.redis
          ? { url: this._config.util.cache.redis.url }
          : {
              socket: {
                host: this._config.util.cache.redis.host,
                port: this._config.util.cache.redis.port,
              },
            };
      return new RedisCache(redisClientOptions, this._logger);
    }
    return new MemoryCache();
  }

  /**
   * Registers the HTTP plugins/routes that depend on the container or must be in
   * place before module APIs register their routes
   */
  protected async registerHttpPlugins(): Promise<void> {
    this.registerAjv();
    await this.initSwagger();
    this.registerApiAuth();
    this.initHealthCheck();
  }

  protected registerAjv() {
    // todo type schema instead of any
    const fastifySchemaCompiler: FastifySchemaCompiler<any> = (
      routeSchema: FastifyRouteSchemaDef<any>,
    ) => this._ajv?.compile(routeSchema.schema) as FastifyValidationResult;
    this._server.setValidatorCompiler(fastifySchemaCompiler);
  }

  protected async initSwagger() {
    if (this._config.util.swagger) {
      await initSwagger(this._config, this._server);
    }
  }

  protected registerApiAuth() {
    const authProvider = this._container.resolve<IApiAuthProvider>('apiAuthProvider');
    this._server.register(apiAuthPluginFp, {
      provider: authProvider,
      options: {
        excludedRoutes: [
          '/health',
          '/health/live',
          '/health/ready',
          '/docs', // API documentation
        ],
        debug: this._config.logLevel <= 2, // Enable debug logs in dev mode
      },
      logger: this._logger,
    });
  }

  protected initHealthCheck() {
    const respond = (reply: FastifyReply, result: HealthCheckResult) =>
      reply
        .code(result.status === 'pass' ? 200 : 503)
        .header('Content-Type', 'application/health+json')
        .send(result);

    const liveness = async (_req: any, reply: FastifyReply) =>
      respond(
        reply,
        this._healthCheckService
          ? this._healthCheckService.checkLiveness()
          : { status: 'pass', checks: {} },
      );

    const readiness = async (_req: any, reply: FastifyReply) => {
      if (!this._healthCheckService) {
        return respond(reply, {
          status: 'fail',
          checks: { init: { status: 'fail', error: 'not yet initialized' } },
        });
      }
      return respond(reply, await this._healthCheckService.checkReadiness());
    };

    this._server.get('/health', liveness);
    this._server.get('/health/live', liveness);
    this._server.get('/health/ready', readiness);
  }

  protected initSequelizeInstance() {
    this._sequelizeInstance = this._container.resolve('sequelizeInstance');
  }

  protected async initMessageBrokerConnection(): Promise<void> {
    this._connectionManager = this._container.resolve('connectionManager');
    this._channelManager = this._container.resolve('channelManager');
    await this._connectionManager.connect();
  }

  protected async initSystem() {
    this.eventGroup = eventGroupFromString(this.appName);

    this.host = this._config.centralSystem.host;
    this.port = this._config.centralSystem.port;

    if (this.eventGroup === EventGroup.All) {
      this._logger.info('Initializing in ALL mode: WebSocket server and all modules');
      this.initNetworkConnection();
      await this.initAllModules();
    } else if (this.eventGroup === EventGroup.Router) {
      this._logger.info('Initializing in ROUTER mode: WebSocket server, no modules');
      this.initNetworkConnection();
    } else if (this.eventGroup === EventGroup.Modules) {
      this._logger.info('Initializing in MODULES mode: all modules without NetworkConnection');
      await this.initAllModules();
    } else {
      await this.initModule();
    }
  }

  protected initNetworkConnection() {
    this._authenticator = this._container.resolve('authenticator');
    this._router = this._container.resolve('router');
    this._networkConnection = this._container.resolve('networkConnection');

    const routerSender = this._container.resolve<BrokerAwareMessageSender>('routerSender');
    routerSender.onCallTimeout = (ocppConnectionName, tenantId) =>
      this._networkConnection!.disconnect(tenantId, ocppConnectionName).then(() => undefined);

    this.apis.push(this._container.resolve<AdminApi>('adminApi'));
  }

  protected async initAllModules() {
    for (const spec of Object.values(CitrineOSServer.MODULE_SPECS)) {
      if (spec && this._config.modules[spec.configKey]) {
        await this.initModuleInScope(spec.moduleToken, spec.routeApis);
      }
    }
  }

  protected async initModule(eventGroup = this.eventGroup) {
    this._logger.info(`Initializing module: ${this.appName}`);
    const spec = eventGroup ? CitrineOSServer.MODULE_SPECS[eventGroup] : undefined;
    if (!spec) {
      throw new Error('Unhandled module type: ' + this.appName);
    }
    await this.initModuleInScope(spec.moduleToken, spec.routeApis);
  }

  /**
   * Builds a module and its APIs together in their own isolated scope, so each
   * API is wired to the exact module instance created here (and the module gets
   * its own message sender/handler). App-wide singletons — repositories,
   * services, the network stack — are created once and reused by every module
   */
  private async initModuleInScope(moduleToken: string, routeApis: string[]): Promise<void> {
    const scope = this._container.createScope();
    const module = scope.resolve<AbstractModule>(moduleToken);
    await this.initHandlersAndAddModule(module);
    for (const routeApi of routeApis) {
      this.apis.push(scope.resolve<IModuleApi>(routeApi));
    }
  }

  protected async initHandlersAndAddModule(module: AbstractModule) {
    await module.initHandlers();
    this.modules.push(module);
  }

  protected async initDb() {
    await sequelize.DefaultSequelizeInstance.initializeSequelize();
    if (process.env.CITRINEOS_USE_DRIZZLE_SECURITY_EVENT === 'true') {
      await DefaultDrizzleInstance.initialize();
    }
  }

  // Not containerized: depends on networkConnection, which only exists in network
  // modes — resolving it from the container would start the websocket servers even
  // in modules-only mode.
  protected initHealthCheckService() {
    this._healthCheckService = new HealthCheckService(
      this._networkConnection,
      this._connectionManager,
      this._cache,
      this._sequelizeInstance,
      this._config.notReadyThresholdSeconds,
      this._logger,
    );
  }

  protected registerShutdownHandlers(): void {
    for (const event of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
      process.on(event, () => {
        this._logger.info(`Received ${event}`);
        this.shutdown().catch((err) => {
          console.error('Shutdown error:', err);
          process.exit(1);
        });
      });
    }
  }

  protected async _syncWebsocketConfig() {
    const serverNetworkProfileRepository = this._container.resolve<IServerNetworkProfileRepository>(
      'serverNetworkProfileRepository',
    );
    for (const websocketServerConfig of this._config.util.networkConnection.websocketServers) {
      await serverNetworkProfileRepository.upsertServerNetworkProfile(
        websocketServerConfig,
        this._config.maxCallLengthSeconds,
      );
    }
  }
}
