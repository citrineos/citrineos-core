// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { apiAuthPluginFp, initSwagger } from '@/apis/index.js';
import { GcpCloudStorage, LocalStorage, S3Storage } from '@/config/index.js';
import { MemoryCache, RedisCache } from '@/services/index.js';
import type {
  BrokerAwareMessageSender,
  RabbitMQChannelManager,
  RabbitMQConnectionManager,
  WebsocketNetworkConnection,
} from '@/transport/index.js';
import {
  type AbstractModule,
  Ajv,
  ConfigLoader,
  type IApiAuthProvider,
  type IAuthenticator,
  type ICache,
  type IFileStorage,
  type IMessageRouter,
  type IModule,
  OCPPValidator,
} from '@citrineos/base';
import {
  DefaultDrizzleInstance,
  type IServerNetworkProfileRepository,
  sequelize,
  Sequelize,
} from '@citrineos/dal';
import { EventGroup, eventGroupFromString, type SystemConfig } from '@citrineos/types';
import cors, { type FastifyCorsOptions } from '@fastify/cors';
import { type JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { asValue, type AwilixContainer } from 'awilix';
import type { FastifyInstance, FastifyReply } from 'fastify';
import fastify from 'fastify';
import type {
  FastifyRouteSchemaDef,
  FastifySchemaCompiler,
  FastifyValidationResult,
} from 'fastify/types/schema.js';
import type { RedisClientOptions } from 'redis';
import { type ILogObj, Logger } from 'tslog';
import { buildContainer } from './container.js';
import { type HealthCheckResult, HealthCheckService } from './health-check-service.js';
import { assertSequelizeSchemaMatches, type SchemaValidationReport } from '@/util/index.js';

/** The container token needed to initialize a module in its own scope. */
export interface ModuleInitSpec {
  moduleToken: string;
}

/** The container tokens for a group of APIs initialized together in one scope. */
export interface ApiInitSpec {
  apiTokens: string[];
}

/**
 * Prebuilt collaborators an embedder can inject instead of letting the server
 * construct its own. Anything omitted is created by the matching `create*()` method,
 * which a subclass may also override.
 */
export interface CitrineOSServerOverrides {
  server?: FastifyInstance;
  ajv?: Ajv.Ajv;
  cache?: ICache;
  fileStorage?: IFileStorage;
  logger?: Logger<ILogObj>;
}

/**
 * The CitrineOS application server: builds the DI container, wires the modules/APIs
 * selected by `appName`, and owns the startup and shutdown sequences.
 *
 * Downstream distributions are expected to subclass rather than fork this file. The
 * intended extension points, roughly in the order they run:
 *
 * - `createLogger()` / `createFastifyInstance()` / `createAjv()` / `createCache()` /
 *   `createFileStorage()` — swap an individual collaborator. (Instances can also be
 *   passed to the constructor via {@link CitrineOSServerOverrides} without subclassing.)
 * - `corsOptions` / `authExcludedRoutes` — tweak the HTTP surface.
 * - `registerAdditionalServices()` — add or replace container registrations
 *   (extra repositories, services, modules, APIs) on top of the core container.
 * - `moduleSpecs` / `apiSpecs` — add distribution-specific modules and API groups to
 *   the startup map, usually by spreading the base value.
 * - `onInitialized()` — run after everything is wired but before the server listens.
 * - `onShutdown()` — flush/close distribution-specific resources during shutdown.
 *
 * Every step of `initialize()` is itself a `protected` method, so anything not covered
 * by the hooks above can still be overridden individually.
 */
export class CitrineOSServer {
  /**
   * Fields
   */
  protected readonly _config: SystemConfig;
  protected readonly appName: string;
  protected readonly overrides: CitrineOSServerOverrides;
  protected readonly modules: IModule[] = [];

  protected _logger!: Logger<ILogObj>;
  protected _server!: FastifyInstance;
  protected _cache!: ICache;
  protected _ajv!: Ajv.Ajv;
  protected _ocppValidator!: OCPPValidator;
  protected _fileStorage!: IFileStorage;
  protected _sequelizeInstance!: Sequelize;
  protected _container!: AwilixContainer;

  protected eventGroup?: EventGroup;
  protected _authenticator?: IAuthenticator;
  protected _router?: IMessageRouter;
  protected _networkConnection?: WebsocketNetworkConnection;
  protected _connectionManager?: RabbitMQConnectionManager;
  protected _channelManager?: RabbitMQChannelManager;
  protected _healthCheckService?: HealthCheckService;
  protected _isShuttingDown = false;
  protected _schemaValidationReport: SchemaValidationReport | null = null;

  // Single source of truth mapping each module's EventGroup to the container token
  // needed to initialize it. initAllModules() and initModule() both read from this
  // (through the `moduleSpecs` getter) instead of repeating the mapping.
  protected static readonly DEFAULT_MODULE_SPECS: Partial<Record<EventGroup, ModuleInitSpec>> = {
    [EventGroup.Certificates]: {
      moduleToken: 'certificatesModule',
    },
    [EventGroup.Configuration]: {
      moduleToken: 'configurationModule',
    },
    [EventGroup.EVDriver]: {
      moduleToken: 'evDriverModule',
    },
    [EventGroup.Monitoring]: {
      moduleToken: 'monitoringModule',
    },
    [EventGroup.Reporting]: {
      moduleToken: 'reportingModule',
    },
    [EventGroup.SmartCharging]: {
      moduleToken: 'smartChargingModule',
    },
    [EventGroup.Transactions]: {
      moduleToken: 'transactionsModule',
    },
    [EventGroup.Tenant]: {
      moduleToken: 'tenantModule',
    },
  };

  protected static readonly DEFAULT_API_SPECS: Partial<Record<EventGroup, ApiInitSpec>> = {
    [EventGroup.Api]: {
      apiTokens: ['commandsApi', 'ocppMessageApi', 'webPaymentApi'],
    },
  };

  /**
   * Modules this server can start, keyed by the EventGroup that selects them.
   * Override to add distribution-specific modules, e.g.
   * `{ ...super.moduleSpecs, [EventGroup.Foo]: { moduleToken: 'fooModule' } }`.
   */
  protected get moduleSpecs(): Partial<Record<EventGroup, ModuleInitSpec>> {
    return CitrineOSServer.DEFAULT_MODULE_SPECS;
  }

  /** API groups this server can start, keyed by the EventGroup that selects them. */
  protected get apiSpecs(): Partial<Record<EventGroup, ApiInitSpec>> {
    return CitrineOSServer.DEFAULT_API_SPECS;
  }

  /** Container tokens for the APIs that come up alongside the WebSocket server. */
  protected get networkApiTokens(): string[] {
    return ['adminApi'];
  }

  // todo rename event group to type
  constructor(
    appName: string,
    systemConfig: SystemConfig,
    overrides: CitrineOSServerOverrides = {},
  ) {
    // TODO: Create and export config schemas for each util module, such as amqp, redis, etc, to avoid passing them possibly invalid configuration
    if (!systemConfig.messageBroker.amqp) {
      throw new Error('This server implementation requires amqp configuration for rabbitMQ.');
    }

    this.appName = appName;
    this._config = systemConfig;
    this.overrides = overrides;
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      await this._syncWebsocketConfig();
      await this._server
        .listen({
          host: this._config.host,
          port: this._config.port,
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

  /**
   * Builds the collaborators, then wires everything that depends on the container,
   * as an ordered sequence. Kept as a flat list of overridable steps on purpose.
   */
  async initialize(): Promise<void> {
    this.initPrimitives();
    await this.initContainer();
    await this.registerHttpPlugins();
    this.initSequelizeInstance();
    await this.initMessageBrokerConnection();
    await this.initSystem();
    await this.initDb();
    this.initHealthCheckService();
    this.registerShutdownHandlers();
    await this.onInitialized();
  }

  async shutdown() {
    if (this._isShuttingDown) return;
    this._isShuttingDown = true;
    this._logger.info('Shutdown initiated');
    this._healthCheckService?.shutdown();

    const forceExit = setTimeout(() => {
      console.log('Shutdown timed out, forcing exit');
      process.exit(1);
    }, this._config.timeouts.shutdownGracePeriodSeconds * 1000); // Default is 30 seconds
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

    await this.onShutdown();

    this._logger.info('Shutdown complete');
    process.exitCode = 0;
  }

  /**
   * Hook: everything is wired and the DB is up, but the server is not listening yet.
   */
  protected async onInitialized(): Promise<void> {}

  /**
   * Hook: the core resources have been closed; release anything the distribution
   * added (tracing exporters, external clients, ...) before shutdown completes.
   */
  protected async onShutdown(): Promise<void> {}

  /**
   * Builds the collaborators the container is seeded with. Each one comes from the
   * matching override, or from a `create*()` method a subclass can replace.
   */
  protected initPrimitives(): void {
    this._logger = this.overrides.logger ?? this.createLogger();
    this._server = this.overrides.server ?? this.createFastifyInstance();
    this._server.register(cors, this.corsOptions);

    console.log('Bootstrap configuration loaded');

    this._ajv = this.createAjv(this.overrides.ajv);

    // A separate OCPPValidator with its own Ajv instance for OCPP message validation.
    // This must be distinct from _ajv: OCPP messages are parsed JSON (no coercion needed),
    // whereas _ajv coerces types for Fastify's HTTP schema compilation.
    this._ocppValidator = this.createOCPPValidator();

    this._cache = this.overrides.cache ?? this.createCache();
    this._fileStorage = this.overrides.fileStorage ?? this.createFileStorage();
  }

  protected createLogger(): Logger<ILogObj> {
    const isCloud = process.env.DEPLOYMENT_TARGET === 'cloud';

    return new Logger<ILogObj>(this.loggerSettings(isCloud));
  }

  /** Split out so a subclass swapping the Logger implementation can reuse the settings. */
  protected loggerSettings(isCloud = process.env.DEPLOYMENT_TARGET === 'cloud') {
    return {
      name: 'CitrineOS Logger',
      minLevel: this._config.logLevel,
      hideLogPositionForProduction: this._config.env === 'production',
      type: isCloud ? ('json' as const) : ('pretty' as const),
    };
  }

  protected createFastifyInstance(): FastifyInstance {
    return fastify().withTypeProvider<JsonSchemaToTsProvider>();
  }

  protected get corsOptions(): FastifyCorsOptions {
    return {
      origin: true, // This can be customized to specify allowed origins
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed HTTP methods
    };
  }

  protected createAjv(ajv?: Ajv.Ajv): Ajv.Ajv {
    return OCPPValidator.createServerAjvInstance(ajv);
  }

  protected createOCPPValidator(): OCPPValidator {
    return new OCPPValidator(this._logger);
  }

  protected createCache(): ICache {
    if (this._config.cache.type === 'redis') {
      const redisClientOptions: RedisClientOptions = { url: this._config.cache.url };

      return new RedisCache(redisClientOptions, this._logger);
    }
    return new MemoryCache();
  }

  protected createFileStorage(): IFileStorage {
    switch (this._config.fileAccess.type) {
      case 'local':
        return new LocalStorage(this._config.fileAccess.local!.defaultFilePath);
      case 's3':
        return new S3Storage(this._config.fileAccess.s3!);
      case 'gcp':
        return new GcpCloudStorage(this._config.fileAccess.gcp!);
      default:
        throw new Error(`Unsupported file access type: ${this._config.fileAccess.type}`);
    }
  }

  /**
   * Builds the DI container from the prebuilt primitives. Everything else is resolved
   * from / wired through it by the rest of initialize().
   */
  protected async initContainer(): Promise<void> {
    await ConfigLoader.loadWebsocketServersConfig(
      this._fileStorage,
      this._config.websocketServerConfigFile,
    );

    this._container = buildContainer(this._config, {
      logger: this._logger,
      cache: this._cache,
      fileStorage: this._fileStorage,
      ocppValidator: this._ocppValidator,
      server: this._server,
    });

    this.registerAdditionalServices(this._container);
  }

  /**
   * Hook: register distribution-specific repositories, services, modules or APIs on
   * the container built by `buildContainer()`. Registering an existing token here
   * replaces the core registration.
   */
  protected registerAdditionalServices(_container: AwilixContainer): void {}

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
    if (this._config.swagger.enabled) {
      await initSwagger(this._config, this._server);
    }
  }

  /** Routes served without API authentication. */
  protected get authExcludedRoutes(): string[] {
    return [
      '/health',
      '/health/live',
      '/health/ready',
      '/docs', // API documentation
    ];
  }

  protected registerApiAuth() {
    const authProvider = this._container.resolve<IApiAuthProvider>('apiAuthProvider');
    this._server.register(apiAuthPluginFp, {
      provider: authProvider,
      options: {
        excludedRoutes: this.authExcludedRoutes,
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

    if (this.eventGroup === EventGroup.All) {
      this._logger.info('Initializing in ALL mode: WebSocket server, all modules and all APIs');
      await this.initNetworkConnection();
      await this.initAllModules();
      this.initAllApis();
    } else if (this.eventGroup === EventGroup.Router) {
      this._logger.info('Initializing in ROUTER mode: WebSocket server, no modules');
      await this.initNetworkConnection();
    } else if (this.eventGroup === EventGroup.Modules) {
      this._logger.info(
        'Initializing in MODULES mode: all modules and all APIs, no NetworkConnection',
      );
      await this.initAllModules();
      this.initAllApis();
    } else if (this.apiSpecs[this.eventGroup]) {
      this._logger.info(`Initializing in API mode: ${this.appName}`);
      this.initApiInScope(this.apiSpecs[this.eventGroup]!.apiTokens);
    } else {
      await this.initModule();
    }
  }

  protected async initNetworkConnection() {
    this._authenticator = this._container.resolve('authenticator');
    this._router = this._container.resolve('router');
    this._networkConnection = this._container.resolve('networkConnection');

    const routerSender = this._container.resolve<BrokerAwareMessageSender>('routerSender');
    routerSender.onCallTimeout = (ocppConnectionName, tenantId) =>
      this._networkConnection!.disconnect(tenantId, ocppConnectionName).then(() => undefined);

    await this._networkConnection.initialize(); // creates the WebSocket servers and starts listening for connections

    this.initApiInScope(this.networkApiTokens);
  }

  protected async initAllModules() {
    for (const spec of Object.values(this.moduleSpecs)) {
      await this.initModuleInScope(spec.moduleToken);
    }
  }

  protected initAllApis() {
    for (const spec of Object.values(this.apiSpecs)) {
      if (spec) {
        this.initApiInScope(spec.apiTokens);
      }
    }
  }

  protected initApiInScope(apiTokens: string[]): void {
    const scope = this._container.createScope();
    scope.register({ moduleScope: asValue(scope) });
    for (const apiToken of apiTokens) {
      scope.resolve(apiToken);
    }
  }

  protected async initModule(eventGroup = this.eventGroup) {
    this._logger.info(`Initializing module: ${this.appName}`);
    const spec = eventGroup ? this.moduleSpecs[eventGroup] : undefined;
    if (!spec) {
      throw new Error('Unhandled module type: ' + this.appName);
    }
    await this.initModuleInScope(spec.moduleToken);
  }

  /**
   * Builds a module in its own isolated scope, so it gets its own message
   * sender/handler. App-wide singletons — repositories, services, the network
   * stack — are created once and reused by every module
   */
  protected async initModuleInScope(moduleToken: string): Promise<void> {
    const scope = this._container.createScope();
    scope.register({ moduleScope: asValue(scope) });
    const module = scope.resolve<AbstractModule>(moduleToken);
    await this.initHandlersAndAddModule(module);
  }

  protected async initHandlersAndAddModule(module: AbstractModule) {
    await module.initHandlers();
    this.modules.push(module);
  }

  protected async initDb() {
    await sequelize.DefaultSequelizeInstance.initializeSequelize();

    this._schemaValidationReport = await assertSequelizeSchemaMatches(
      this._sequelizeInstance,
      this._config,
      this._logger,
    );

    if (process.env.CITRINEOS_USE_DRIZZLE === 'true') {
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
      this._config.timeouts.notReadyThresholdSeconds,
      this._logger,
    );
    this._healthCheckService.setSchemaValidationReport(this._schemaValidationReport);
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
    for (const websocketServerConfig of this._networkConnection?.getWebsocketServers() ?? []) {
      await serverNetworkProfileRepository.upsertServerNetworkProfile(
        websocketServerConfig,
        this._config.timeouts.maxCallLengthSeconds,
      );
    }
  }
}
