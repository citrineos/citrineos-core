// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  type AbstractModule,
  type AbstractModuleApi,
  Ajv,
  EventGroup,
  eventGroupFromString,
  type IAuthenticator,
  type ICache,
  type IFileAccess,
  type IMessageHandler,
  type IMessageSender,
  type IModule,
  type IModuleApi,
  type SystemConfig,
} from '@citrineos/base';
import { MonitoringModule, MonitoringModuleApi } from '@citrineos/monitoring';
import {
  Authenticator,
  DirectusUtil,
  initSwagger,
  MemoryCache,
  RabbitMqReceiver,
  RabbitMqSender,
  RedisCache,
  WebsocketNetworkConnection,
} from '@citrineos/util';
import { type JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import addFormats from 'ajv-formats';
import fastify, { type FastifyInstance } from 'fastify';
import { type ILogObj, Logger } from 'tslog';
import { systemConfig } from './config';
import {
  ConfigurationModule,
  ConfigurationModuleApi,
} from '@citrineos/configuration';
import {
  TransactionsModule,
  TransactionsModuleApi,
} from '@citrineos/transactions';
import {
  CertificatesModule,
  CertificatesModuleApi,
} from '@citrineos/certificates';
import { EVDriverModule, EVDriverModuleApi } from '@citrineos/evdriver';
import { ReportingModule, ReportingModuleApi } from '@citrineos/reporting';
import {
  SmartChargingModule,
  SmartChargingModuleApi,
} from '@citrineos/smartcharging';
import { RepositoryStore, sequelize, Sequelize } from '@citrineos/data';
import {
  type FastifyRouteSchemaDef,
  type FastifySchemaCompiler,
  type FastifyValidationResult,
} from 'fastify/types/schema';
import {
  AdminApi,
  MessageRouterImpl,
  WebhookDispatcher,
} from '@citrineos/ocpprouter';
import { TenantModule, TenantModuleApi } from '@citrineos/tenant';

interface ModuleConfig {
  ModuleClass: new (...args: any[]) => AbstractModule;
  ModuleApiClass: new (...args: any[]) => AbstractModuleApi<any>;
  configModule: any; // todo type?
}

export class CitrineOSServer {
  /**
   * Fields
   */
  private readonly _config: SystemConfig;
  private readonly _logger: Logger<ILogObj>;
  private readonly _server: FastifyInstance;
  private readonly _cache: ICache;
  private readonly _ajv: Ajv;
  private readonly _fileAccess: IFileAccess;
  private readonly modules: IModule[] = [];
  private readonly apis: IModuleApi[] = [];
  private _sequelizeInstance!: Sequelize;
  private host?: string;
  private port?: number;
  private eventGroup?: EventGroup;
  private _authenticator?: IAuthenticator;
  private _networkConnection?: WebsocketNetworkConnection;
  private _repositoryStore!: RepositoryStore;

  private readonly appName: string;

  /**
   * Constructor for the class.
   *
   * @param {EventGroup} appName - app type
   * @param {SystemConfig} config - config
   * @param {FastifyInstance} server - optional Fastify server instance
   * @param {Ajv} ajv - optional Ajv JSON schema validator instance
   * @param {ICache} cache - cache
   */
  // todo rename event group to type
  constructor(
    appName: string,
    config: SystemConfig,
    server?: FastifyInstance,
    ajv?: Ajv,
    cache?: ICache,
    fileAccess?: IFileAccess,
  ) {
    // Set system config
    // TODO: Create and export config schemas for each util module, such as amqp, redis, kafka, etc, to avoid passing them possibly invalid configuration
    if (!config.util.messageBroker.amqp) {
      throw new Error(
        'This server implementation requires amqp configuration for rabbitMQ.',
      );
    }

    this.appName = appName;
    this._config = config;
    this._server =
      server || fastify().withTypeProvider<JsonSchemaToTsProvider>();

    // Add health check
    this.initHealthCheck();

    // Create Ajv JSON schema validator instance
    this._ajv = this.initAjv(ajv);
    this.addAjvFormats();

    // Initialize parent logger
    this._logger = this.initLogger();

    // Set cache implementation
    this._cache = this.initCache(cache);

    // Initialize Swagger if enabled
    this.initSwagger();

    // Add Directus Message API flow creation if enabled
    let directusUtil;
    if (this._config.util.directus?.generateFlows) {
      directusUtil = new DirectusUtil(this._config, this._logger);
      this._server.addHook(
        'onRoute',
        directusUtil.addDirectusMessageApiFlowsFastifyRouteHook.bind(
          directusUtil,
        ),
      );
      this._server.addHook('onReady', async () => {
        this._logger?.info('Directus actions initialization finished');
      });
    }

    // Initialize File Access Implementation
    this._fileAccess = this.initFileAccess(fileAccess, directusUtil);

    // Register AJV for schema validation
    this.registerAjv();

    // Initialize repository store
    this.initRepositoryStore();

    // Initialize module & API
    // Always initialize API after SwaggerUI
    this.initSystem();
  }

  async initialize(): Promise<void> {
    // Initialize database
    await this.initDb();

    // Set up shutdown handlers
    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGQUIT', this.shutdown.bind(this));
  }

  shutdown() {
    // todo shut down depending on setup
    // Shut down all modules and central system
    this.modules.forEach((module) => {
      module.shutdown();
    });
    this._networkConnection?.shutdown();

    // Shutdown server
    this._server.close().then(); // todo async?

    setTimeout(() => {
      console.log('Exiting...');
      process.exit(1);
    }, 2000);
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
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
      await Promise.reject(error);
    }
  }

  protected _createSender(): IMessageSender {
    return new RabbitMqSender(this._config, this._logger);
  }

  protected _createHandler(): IMessageHandler {
    return new RabbitMqReceiver(this._config, this._logger);
  }

  private initHealthCheck() {
    this._server.get('/health', async () => ({ status: 'healthy' }));
  }

  private initAjv(ajv?: Ajv) {
    return (
      ajv ||
      new Ajv({
        removeAdditional: 'all',
        useDefaults: true,
        coerceTypes: 'array',
        strict: false,
      })
    );
  }

  private addAjvFormats() {
    addFormats(this._ajv, {
      mode: 'fast',
      formats: ['date-time'],
    });
  }

  private initLogger() {
    return new Logger<ILogObj>({
      name: 'CitrineOS Logger',
      minLevel: systemConfig.logLevel,
      hideLogPositionForProduction: systemConfig.env === 'production',
      // Disable colors for cloud deployment as some cloud logging environments such as cloudwatch can not interpret colors
      stylePrettyLogs: process.env.DEPLOYMENT_TARGET !== 'cloud',
    });
  }

  private async initDb() {
    await sequelize.DefaultSequelizeInstance.initializeSequelize();
  }

  private initCache(cache?: ICache): ICache {
    return (
      cache ||
      (this._config.util.cache.redis
        ? new RedisCache({
            socket: {
              host: this._config.util.cache.redis.host,
              port: this._config.util.cache.redis.port,
            },
          })
        : new MemoryCache())
    );
  }

  private initSwagger() {
    if (this._config.util.swagger) {
      initSwagger(this._config, this._server);
    }
  }

  private registerAjv() {
    // todo type schema instead of any
    const fastifySchemaCompiler: FastifySchemaCompiler<any> = (
      routeSchema: FastifyRouteSchemaDef<any>,
    ) => this._ajv?.compile(routeSchema.schema) as FastifyValidationResult;
    this._server.setValidatorCompiler(fastifySchemaCompiler);
  }

  private initNetworkConnection() {
    this._authenticator = new Authenticator(
      this._cache,
      new sequelize.SequelizeLocationRepository(this._config, this._logger),
      new sequelize.SequelizeDeviceModelRepository(this._config, this._logger),
      this._logger,
    );

    const webhookDispatcher = new WebhookDispatcher(
      this._repositoryStore.subscriptionRepository,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = new MessageRouterImpl(
      this._config,
      this._cache,
      this._createSender(),
      this._createHandler(),
      webhookDispatcher,
      async (_identifier: string, _message: string) => false,
      this._logger,
      this._ajv,
    );

    this._networkConnection = new WebsocketNetworkConnection(
      this._config,
      this._cache,
      this._authenticator,
      router,
      this._logger,
    );

    this.apis.push(new AdminApi(router, this._server, this._logger));

    this.host = this._config.centralSystem.host;
    this.port = this._config.centralSystem.port;
  }

  private initAllModules() {
    if (this._config.modules.certificates) {
      const module = new CertificatesModule(
        this._config,
        this._cache,
        this._createSender(),
        this._createHandler(),
        this._logger,
        this._repositoryStore.deviceModelRepository,
        this._repositoryStore.certificateRepository,
        this._repositoryStore.locationRepository,
      );
      this.modules.push(module);
      this.apis.push(
        new CertificatesModuleApi(
          module,
          this._server,
          this._fileAccess,
          this._networkConnection!,
          this._config.util.networkConnection.websocketServers,
          this._logger,
        ),
      );
    }

    if (this._config.modules.configuration) {
      const module = new ConfigurationModule(
        this._config,
        this._cache,
        this._createSender(),
        this._createHandler(),
        this._logger,
        this._repositoryStore.bootRepository,
        this._repositoryStore.deviceModelRepository,
        this._repositoryStore.messageInfoRepository,
      );
      this.modules.push(module);
      this.apis.push(
        new ConfigurationModuleApi(module, this._server, this._logger),
      );
    }

    if (this._config.modules.evdriver) {
      const module = new EVDriverModule(
        this._config,
        this._cache,
        this._createSender(),
        this._createHandler(),
        this._logger,
        this._repositoryStore.authorizationRepository,
        this._repositoryStore.localAuthListRepository,
        this._repositoryStore.deviceModelRepository,
        this._repositoryStore.tariffRepository,
      );
      this.modules.push(module);
      this.apis.push(new EVDriverModuleApi(module, this._server, this._logger));
    }

    if (this._config.modules.monitoring) {
      const module = new MonitoringModule(
        this._config,
        this._cache,
        this._createSender(),
        this._createHandler(),
        this._logger,
        this._repositoryStore.deviceModelRepository,
        this._repositoryStore.variableMonitoringRepository,
      );
      this.modules.push(module);
      this.apis.push(
        new MonitoringModuleApi(module, this._server, this._logger),
      );
    }

    if (this._config.modules.reporting) {
      const module = new ReportingModule(
        this._config,
        this._cache,
        this._createSender(),
        this._createHandler(),
        this._logger,
        this._repositoryStore.deviceModelRepository,
        this._repositoryStore.securityEventRepository,
        this._repositoryStore.variableMonitoringRepository,
      );
      this.modules.push(module);
      this.apis.push(
        new ReportingModuleApi(module, this._server, this._logger),
      );
    }

    if (this._config.modules.smartcharging) {
      const module = new SmartChargingModule(
        this._config,
        this._cache,
        this._createSender(),
        this._createHandler(),
        this._logger,
      );
      this.modules.push(module);
      this.apis.push(
        new SmartChargingModuleApi(module, this._server, this._logger),
      );
    }

    if (this._config.modules.transactions) {
      const module = new TransactionsModule(
        this._config,
        this._cache,
        this._fileAccess,
        this._createSender(),
        this._createHandler(),
        this._logger,
        this._repositoryStore.transactionEventRepository,
        this._repositoryStore.authorizationRepository,
        this._repositoryStore.deviceModelRepository,
        this._repositoryStore.componentRepository,
        this._repositoryStore.locationRepository,
        this._repositoryStore.tariffRepository,
      );
      this.modules.push(module);
      this.apis.push(
        new TransactionsModuleApi(module, this._server, this._logger),
      );
    }

    // TODO: take actions to make sure module has correct subscriptions and log proof
    if (this.eventGroup !== EventGroup.All) {
      this.host = this._config.centralSystem.host as string;
      this.port = this._config.centralSystem.port as number;
    }
  }

  private initModule(moduleConfig: ModuleConfig) {
    if (moduleConfig.configModule !== null) {
      const module = new moduleConfig.ModuleClass(
        this._config,
        this._cache,
        this._createSender(),
        this._createHandler(),
        this._logger,
      );
      this.modules.push(module);
      if (moduleConfig.ModuleApiClass === CertificatesModuleApi) {
        this.apis.push(
          new moduleConfig.ModuleApiClass(
            module,
            this._server,
            this._fileAccess,
            this._networkConnection,
            this._config.util.networkConnection.websocketServers,
            this._logger,
          ),
        );
      } else {
        this.apis.push(
          new moduleConfig.ModuleApiClass(module, this._server, this._logger),
        );
      }

      // TODO: take actions to make sure module has correct subscriptions and log proof
      this._logger?.info(`${moduleConfig.ModuleClass.name} module started...`);
      if (this.eventGroup !== EventGroup.All) {
        this.host = moduleConfig.configModule.host as string;
        this.port = moduleConfig.configModule.port as number;
      }
    } else {
      throw new Error(`No config for ${this.eventGroup} module`);
    }
  }

  private getModuleConfig(): ModuleConfig {
    switch (this.eventGroup) {
      case EventGroup.Certificates:
        return {
          ModuleClass: CertificatesModule,
          ModuleApiClass: CertificatesModuleApi,
          configModule: this._config.modules.certificates,
        };
      case EventGroup.Configuration:
        return {
          ModuleClass: ConfigurationModule,
          ModuleApiClass: ConfigurationModuleApi,
          configModule: this._config.modules.configuration,
        };
      case EventGroup.EVDriver:
        return {
          ModuleClass: EVDriverModule,
          ModuleApiClass: EVDriverModuleApi,
          configModule: this._config.modules.evdriver,
        };
      case EventGroup.Monitoring:
        return {
          ModuleClass: MonitoringModule,
          ModuleApiClass: MonitoringModuleApi,
          configModule: this._config.modules.monitoring,
        };
      case EventGroup.Reporting:
        return {
          ModuleClass: ReportingModule,
          ModuleApiClass: ReportingModuleApi,
          configModule: this._config.modules.reporting,
        };
      case EventGroup.SmartCharging:
        return {
          ModuleClass: SmartChargingModule,
          ModuleApiClass: SmartChargingModuleApi,
          configModule: this._config.modules.smartcharging,
        };
      case EventGroup.Tenant:
        return {
          ModuleClass: TenantModule,
          ModuleApiClass: TenantModuleApi,
          configModule: this._config.modules.tenant,
        };
      case EventGroup.Transactions:
        return {
          ModuleClass: TransactionsModule,
          ModuleApiClass: TransactionsModuleApi,
          configModule: this._config.modules.transactions,
        };
      default:
        throw new Error('Unhandled module type: ' + this.appName);
    }
  }

  private initSystem() {
    this.eventGroup = eventGroupFromString(this.appName);
    if (this.eventGroup === EventGroup.All) {
      this.initNetworkConnection();
      this.initAllModules();
    } else if (this.eventGroup === EventGroup.General) {
      this.initNetworkConnection();
    } else {
      const moduleConfig: ModuleConfig = this.getModuleConfig();
      this.initModule(moduleConfig);
    }
  }

  private initFileAccess(
    fileAccess?: IFileAccess,
    directus?: IFileAccess,
  ): IFileAccess {
    return (
      fileAccess || directus || new DirectusUtil(this._config, this._logger)
    );
  }

  private initRepositoryStore() {
    this._sequelizeInstance = sequelize.DefaultSequelizeInstance.getInstance(
      this._config,
      this._logger,
    );
    this._repositoryStore = new RepositoryStore(
      this._config,
      this._logger,
      this._sequelizeInstance,
    );
  }
}

async function main() {
  const server = new CitrineOSServer(
    process.env.APP_NAME as EventGroup,
    systemConfig,
  );
  server.run().catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
