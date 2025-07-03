// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  type AbstractModule,
  Ajv,
  BootstrapConfig,
  ConfigStoreFactory,
  EventGroup,
  eventGroupFromString,
  IApiAuthProvider,
  type IAuthenticator,
  type ICache,
  type IFileStorage,
  type IMessageHandler,
  type IMessageSender,
  type IModule,
  type IModuleApi,
  loadBootstrapConfig,
  type SystemConfig,
} from '@citrineos/base';
import { MonitoringDataApi, MonitoringModule, MonitoringOcpp201Api } from '@citrineos/monitoring';
import {
  Authenticator,
  BasicAuthenticationFilter,
  CertificateAuthorityService,
  ConnectedStationFilter,
  DirectusUtil,
  IdGenerator,
  initSwagger,
  LocalBypassAuthProvider,
  MemoryCache,
  NetworkProfileFilter,
  OIDCAuthProvider,
  RabbitMqReceiver,
  RabbitMqSender,
  RedisCache,
  UnknownStationFilter,
  WebsocketNetworkConnection,
} from '@citrineos/util';
import { type JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import addFormats from 'ajv-formats';
import fastify, { type FastifyInstance, RouteOptions } from 'fastify';
import { type ILogObj, Logger } from 'tslog';
import { getSystemConfig } from './config';
import {
  ConfigurationDataApi,
  ConfigurationModule,
  ConfigurationOcpp16Api,
  ConfigurationOcpp201Api,
} from '@citrineos/configuration';
import {
  TransactionsDataApi,
  TransactionsModule,
  TransactionsOcpp201Api,
} from '@citrineos/transactions';
import {
  CertificatesDataApi,
  CertificatesModule,
  CertificatesOcpp201Api,
} from '@citrineos/certificates';
import {
  EVDriverDataApi,
  EVDriverModule,
  EVDriverOcpp16Api,
  EVDriverOcpp201Api,
} from '@citrineos/evdriver';
import { ReportingModule, ReportingOcpp201Api } from '@citrineos/reporting';
import {
  InternalSmartCharging,
  ISmartCharging,
  SmartChargingModule,
  SmartChargingOcpp201Api,
} from '@citrineos/smartcharging';
import { RepositoryStore, sequelize, Sequelize, ServerNetworkProfile } from '@citrineos/data';
import {
  type FastifyRouteSchemaDef,
  type FastifySchemaCompiler,
  type FastifyValidationResult,
} from 'fastify/types/schema';
import { AdminApi, MessageRouterImpl, WebhookDispatcher } from '@citrineos/ocpprouter';
import cors from '@fastify/cors';
import ApiAuthPlugin from '@citrineos/util/dist/authorization/ApiAuthPlugin';

export class CitrineOSServer {
  /**
   * Fields
   */
  private readonly _config: BootstrapConfig & SystemConfig;
  private readonly _logger: Logger<ILogObj>;
  private readonly _server: FastifyInstance;
  private readonly _cache: ICache;
  private readonly _ajv: Ajv;
  private readonly _fileStorage: IFileStorage;
  private readonly modules: IModule[] = [];
  private readonly apis: IModuleApi[] = [];
  private _sequelizeInstance!: Sequelize;
  private host?: string;
  private port?: number;
  private eventGroup?: EventGroup;
  private _authenticator?: IAuthenticator;
  private _networkConnection?: WebsocketNetworkConnection;
  private _repositoryStore!: RepositoryStore;
  private _idGenerator!: IdGenerator;
  private _certificateAuthorityService!: CertificateAuthorityService;
  private _smartChargingService!: ISmartCharging;

  private readonly appName: string;

  /**
   * Constructor for the class.
   *
   * @param {EventGroup} appName - app type
   * @param {SystemConfig} systemConfig - config
   * @param {FastifyInstance} server - optional Fastify server instance
   * @param {Ajv} ajv - optional Ajv JSON schema validator instance
   * @param {ICache} cache - cache
   * @param {IFileStorage} _fileStorage - file storage
   */
  // todo rename event group to type
  constructor(
    appName: string,
    bootstrapConfig: BootstrapConfig,
    systemConfig: SystemConfig,
    server?: FastifyInstance,
    ajv?: Ajv,
    cache?: ICache,
    _fileStorage?: IFileStorage,
  ) {
    // TODO: Create and export config schemas for each util module, such as amqp, redis, kafka, etc, to avoid passing them possibly invalid configuration
    if (!systemConfig.util.messageBroker.amqp) {
      throw new Error('This server implementation requires amqp configuration for rabbitMQ.');
    }

    this.appName = appName;
    this._config = { ...bootstrapConfig, ...systemConfig };
    this._server = server || fastify().withTypeProvider<JsonSchemaToTsProvider>();

    // enable cors
    (this._server as any).register(cors, {
      origin: true, // This can be customized to specify allowed origins
      methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    });

    console.log('Bootstrap configuration loaded');
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
    this.initSwagger()
      .then()
      .catch((error) => this._logger.error('Could not initialize swagger', error));

    // Add Directus Message API flow creation if enabled
    if (this._config.fileAccess.directus?.generateFlows) {
      const directusUtil = ConfigStoreFactory.getInstance() as DirectusUtil;
      this._server.addHook('onRoute', (routeOptions: RouteOptions) => {
        directusUtil!
          .addDirectusMessageApiFlowsFastifyRouteHook(routeOptions, this._server.getSchemas())
          .then()
          .catch((error) => {
            this._logger.error('Could not add Directus Message API flow', error);
          });
      });

      this._server.addHook('onReady', async () => {
        this._logger?.info('Directus actions initialization finished');
      });
    }

    // Initialize File Access Implementation
    this._fileStorage = ConfigStoreFactory.getInstance();

    // Register AJV for schema validation
    this.registerAjv();

    // Register API authentication
    this.registerApiAuth();

    // Initialize repository store
    this.initRepositoryStore();
    this.initIdGenerator();
    this.initCertificateAuthorityService();
    this.initSmartChargingService();
  }

  async initialize(): Promise<void> {
    // Initialize module & API
    // Always initialize API after SwaggerUI
    await this.initSystem();

    // Initialize database
    await this.initDb();

    // Set up shutdown handlers
    for (const event of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
      process.on(event, async () => {
        await this.shutdown();
      });
    }
  }

  async shutdown() {
    // todo shut down depending on setup
    // Shut down all modules and central system
    for (const module of this.modules) {
      await module.shutdown();
    }
    await this._networkConnection?.shutdown();

    // Shutdown server
    await this._server.close();

    setTimeout(() => {
      console.log('Exiting...');
      process.exit(1);
    }, 2000);
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
      await Promise.reject(error);
    }
  }

  protected async _syncWebsocketConfig() {
    for (const websocketServerConfig of this._config.util.networkConnection.websocketServers) {
      const [serverNetworkProfile] = await ServerNetworkProfile.findOrBuild({
        where: {
          id: websocketServerConfig.id,
        },
      });
      serverNetworkProfile.host = websocketServerConfig.host;
      serverNetworkProfile.port = websocketServerConfig.port;
      serverNetworkProfile.pingInterval = websocketServerConfig.pingInterval;
      serverNetworkProfile.protocol = websocketServerConfig.protocol;
      serverNetworkProfile.messageTimeout = this._config.maxCallLengthSeconds;
      serverNetworkProfile.securityProfile = websocketServerConfig.securityProfile;
      serverNetworkProfile.allowUnknownChargingStations =
        websocketServerConfig.allowUnknownChargingStations;
      serverNetworkProfile.tlsKeyFilePath = websocketServerConfig.tlsKeyFilePath;
      serverNetworkProfile.tlsCertificateChainFilePath =
        websocketServerConfig.tlsCertificateChainFilePath;
      serverNetworkProfile.mtlsCertificateAuthorityKeyFilePath =
        websocketServerConfig.mtlsCertificateAuthorityKeyFilePath;
      serverNetworkProfile.rootCACertificateFilePath =
        websocketServerConfig.rootCACertificateFilePath;

      await serverNetworkProfile.save();
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
    const isCloud = process.env.DEPLOYMENT_TARGET === 'cloud';
    return new Logger<ILogObj>({
      name: 'CitrineOS Logger',
      minLevel: this._config.logLevel,
      hideLogPositionForProduction: this._config.env === 'production',
      overwrite:
        this._config && this._config.logLevel !== undefined && this._config.logLevel <= 2
          ? undefined
          : {
              transportJSON: (logObj: any) => {
                function jsonStringifyRecursive(obj: unknown) {
                  const cache = new Set();
                  return JSON.stringify(obj, (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                      if (cache.has(value)) {
                        // Circular reference is found, discard key
                        return '[Circular]';
                      }
                      // Store value in our collection
                      cache.add(value);
                    }
                    if (typeof value === 'bigint') {
                      return `${value}`;
                    }
                    if (typeof value === 'undefined') {
                      return '[undefined]';
                    }
                    return value;
                  });
                }

                if (logObj._meta) {
                  const { path, name, date, logLevelId, logLevelName } = logObj._meta;
                  const { _meta, ...rest } = logObj;
                  logObj = {
                    ...rest,
                    path: path?.fullFilePath,
                    name,
                    date,
                    logLevelId,
                    logLevelName,
                  };
                }
                console.log(jsonStringifyRecursive(logObj));
              },
            },
      // Disable colors for cloud deployment as some cloud logging environments such as cloudwatch can not interpret colors
      stylePrettyLogs: !isCloud,
      type: isCloud ? 'json' : 'pretty',
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

  private async initSwagger() {
    if (this._config.util.swagger) {
      await initSwagger(this._config, this._server);
    }
  }

  private registerAjv() {
    // todo type schema instead of any
    const fastifySchemaCompiler: FastifySchemaCompiler<any> = (
      routeSchema: FastifyRouteSchemaDef<any>,
    ) => this._ajv?.compile(routeSchema.schema) as FastifyValidationResult;
    this._server.setValidatorCompiler(fastifySchemaCompiler);
  }

  private registerApiAuth() {
    const authProvider = this.initApiAuthProvider();
    this._server.register(ApiAuthPlugin, {
      provider: authProvider,
      options: {
        excludedRoutes: [
          '/health', // Health check endpoint
          '/docs', // API documentation
        ],
        debug: this._config.logLevel <= 2, // Enable debug logs in dev mode
      },
    });
  }

  private initNetworkConnection() {
    this._authenticator = new Authenticator(
      new UnknownStationFilter(
        new sequelize.SequelizeLocationRepository(this._config, this._logger),
        this._logger,
      ),
      new ConnectedStationFilter(this._cache, this._logger),
      new NetworkProfileFilter(
        new sequelize.SequelizeDeviceModelRepository(this._config, this._logger),
        this._logger,
      ),
      new BasicAuthenticationFilter(
        new sequelize.SequelizeDeviceModelRepository(this._config, this._logger),
        this._logger,
      ),
      this._logger,
    );

    const webhookDispatcher = new WebhookDispatcher(this._repositoryStore.subscriptionRepository);

    const router = new MessageRouterImpl(
      this._config,
      this._cache,
      this._createSender(),
      this._createHandler(),
      webhookDispatcher,
      async (_identifier: string, _message: string) => {},
      this._logger,
      this._ajv,
      this._repositoryStore.locationRepository,
      this._repositoryStore.subscriptionRepository,
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

  private async initHandlersAndAddModule(module: AbstractModule) {
    await module.initHandlers();
    this.modules.push(module);
  }

  private async initAllModules() {
    if (this._config.modules.certificates) {
      await this.initCertificatesModule();
    }

    if (this._config.modules.configuration) {
      await this.initConfigurationModule();
    }

    if (this._config.modules.evdriver) {
      await this.initEVDriverModule();
    }

    if (this._config.modules.monitoring) {
      await this.initMonitoringModule();
    }

    if (this._config.modules.reporting) {
      await this.initReportingModule();
    }

    if (this._config.modules.smartcharging) {
      await this.initSmartChargingModule();
    }

    if (this._config.modules.transactions) {
      await this.initTransactionsModule();
    }

    // TODO: take actions to make sure module has correct subscriptions and log proof
    if (this.eventGroup !== EventGroup.All) {
      this.host = this._config.centralSystem.host as string;
      this.port = this._config.centralSystem.port as number;
    }
  }

  private initApiAuthProvider(): IApiAuthProvider {
    this._logger.info('Initializing API authentication provider,', this._config.util.authProvider);
    if (this._config.util.authProvider.oidc) {
      return new OIDCAuthProvider(this._config.util.authProvider.oidc, this._logger);
    } else if (this._config.util.authProvider.localByPass) {
      return new LocalBypassAuthProvider(this._logger);
    } else {
      throw new Error('No valid API authentication provider configured');
    }
  }

  private async initCertificatesModule() {
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
    await this.initHandlersAndAddModule(module);
    this.apis.push(
      new CertificatesOcpp201Api(module, this._server, this._logger),
      new CertificatesDataApi(
        module,
        this._server,
        this._fileStorage,
        this._networkConnection!,
        this._config.util.networkConnection.websocketServers,
        this._logger,
      ),
    );
  }

  private async initConfigurationModule() {
    const module = new ConfigurationModule(
      this._config,
      this._cache,
      this._createSender(),
      this._createHandler(),
      this._logger,
      this._repositoryStore.bootRepository,
      this._repositoryStore.deviceModelRepository,
      this._repositoryStore.messageInfoRepository,
      this._repositoryStore.locationRepository,
      this._repositoryStore.changeConfigurationRepository,
      this._repositoryStore.ocppMessageRepository,
      this._idGenerator,
    );
    await this.initHandlersAndAddModule(module);
    this.apis.push(
      new ConfigurationOcpp201Api(module, this._server, this._logger),
      new ConfigurationOcpp16Api(module, this._server, this._logger),
      new ConfigurationDataApi(module, this._server, this._logger),
    );
  }

  private async initEVDriverModule() {
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
      this._repositoryStore.transactionEventRepository,
      this._repositoryStore.chargingProfileRepository,
      this._repositoryStore.reservationRepository,
      this._repositoryStore.ocppMessageRepository,
      this._certificateAuthorityService,
      [],
      this._idGenerator,
    );
    await this.initHandlersAndAddModule(module);
    this.apis.push(
      new EVDriverOcpp201Api(module, this._server, this._logger),
      new EVDriverOcpp16Api(module, this._server, this._logger),
      new EVDriverDataApi(module, this._server, this._logger),
    );
  }

  private async initMonitoringModule() {
    const module = new MonitoringModule(
      this._config,
      this._cache,
      this._createSender(),
      this._createHandler(),
      this._logger,
      this._repositoryStore.deviceModelRepository,
      this._repositoryStore.variableMonitoringRepository,
      this._idGenerator,
    );
    await this.initHandlersAndAddModule(module);
    this.apis.push(
      new MonitoringOcpp201Api(module, this._server, this._logger),
      new MonitoringDataApi(module, this._server, this._logger),
    );
  }

  private async initReportingModule() {
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
    await this.initHandlersAndAddModule(module);
    this.apis.push(new ReportingOcpp201Api(module, this._server, this._logger));
  }

  private async initSmartChargingModule() {
    const module = new SmartChargingModule(
      this._config,
      this._cache,
      this._createSender(),
      this._createHandler(),
      this._logger,
      this._repositoryStore.transactionEventRepository,
      this._repositoryStore.deviceModelRepository,
      this._repositoryStore.chargingProfileRepository,
      this._smartChargingService,
      this._idGenerator,
    );
    await this.initHandlersAndAddModule(module);
    this.apis.push(new SmartChargingOcpp201Api(module, this._server, this._logger));
  }

  private async initTransactionsModule() {
    const module = new TransactionsModule(
      this._config,
      this._cache,
      this._fileStorage,
      this._createSender(),
      this._createHandler(),
      this._logger,
      this._repositoryStore.transactionEventRepository,
      this._repositoryStore.authorizationRepository,
      this._repositoryStore.deviceModelRepository,
      this._repositoryStore.componentRepository,
      this._repositoryStore.locationRepository,
      this._repositoryStore.tariffRepository,
      this._repositoryStore.reservationRepository,
      this._repositoryStore.ocppMessageRepository,
    );
    await this.initHandlersAndAddModule(module);
    this.apis.push(
      new TransactionsOcpp201Api(module, this._server, this._logger),
      new TransactionsDataApi(module, this._server, this._logger),
    );
  }

  private async initModule(eventGroup = this.eventGroup) {
    switch (eventGroup) {
      case EventGroup.Certificates:
        await this.initCertificatesModule();
        break;
      case EventGroup.Configuration:
        await this.initConfigurationModule();
        break;
      case EventGroup.EVDriver:
        await this.initEVDriverModule();
        break;
      case EventGroup.Monitoring:
        await this.initMonitoringModule();
        break;
      case EventGroup.Reporting:
        await this.initReportingModule();
        break;
      case EventGroup.SmartCharging:
        await this.initSmartChargingModule();
        break;
      case EventGroup.Transactions:
        await this.initTransactionsModule();
        break;
      default:
        throw new Error('Unhandled module type: ' + this.appName);
    }
  }

  private async initSystem() {
    this.eventGroup = eventGroupFromString(this.appName);
    if (this.eventGroup === EventGroup.All) {
      this.initNetworkConnection();
      await this.initAllModules();
    } else if (this.eventGroup === EventGroup.General) {
      this.initNetworkConnection();
    } else {
      await this.initModule();
    }
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

  private initIdGenerator() {
    this._idGenerator = new IdGenerator(this._repositoryStore.chargingStationSequenceRepository);
  }

  private initCertificateAuthorityService() {
    this._certificateAuthorityService = new CertificateAuthorityService(this._config, this._logger);
  }

  private initSmartChargingService() {
    this._smartChargingService = new InternalSmartCharging(
      this._repositoryStore.chargingProfileRepository,
    );
  }
}

async function main() {
  const bootstrapConfig = loadBootstrapConfig();
  const config = await getSystemConfig(bootstrapConfig);
  const server = new CitrineOSServer(process.env.APP_NAME as EventGroup, bootstrapConfig, config);
  server.run().catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
