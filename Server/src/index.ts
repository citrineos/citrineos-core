// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  type AbstractModule,
  type AbstractModuleApi,
  EventGroup,
  eventGroupFromString,
  type IAuthenticator,
  type ICache,
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
import Ajv from 'ajv';
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
import { sequelize } from '@citrineos/data';
import {
  type FastifyRouteSchemaDef,
  type FastifySchemaCompiler,
  type FastifyValidationResult,
} from 'fastify/types/schema';
import { AdminApi, MessageRouterImpl } from '@citrineos/ocpprouter';
import {
  CredentialsModuleApi,
  EverythingElseApi,
  OcpiModule,
  VersionsModuleApi,
} from '@citrineos/ocpi';
import deasyncPromise from 'deasync-promise';

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
  private readonly modules: IModule[] = [];
  private readonly apis: IModuleApi[] = [];
  private host?: string;
  private port?: number;
  private eventGroup?: EventGroup;
  private _authenticator?: IAuthenticator;
  private _networkConnection?: WebsocketNetworkConnection;

  /**
   * Constructor for the class.
   *
   * @param {String} appName - event group
   * @param {SystemConfig} config - config
   * @param {FastifyInstance} server - optional Fastify server instance
   * @param {Ajv} ajv - optional Ajv JSON schema validator instance
   */
  // todo rename event group to type
  constructor(
    appName: string,
    config: SystemConfig,
    server?: FastifyInstance,
    ajv?: Ajv,
    cache?: ICache,
  ) {
    // Set event group
    this.eventGroup = eventGroupFromString(appName);

    // Set system config
    // TODO: Create and export config schemas for each util module, such as amqp, redis, kafka, etc, to avoid passing them possibly invalid configuration
    if (!config.util.messageBroker.amqp) {
      throw new Error(
        'This server implementation requires amqp configuration for rabbitMQ.',
      );
    }
    this._config = config;

    // Create server instance
    this._server =
      server || fastify().withTypeProvider<JsonSchemaToTsProvider>();

    // Add health check
    this.initHealthCheck();

    // Create Ajv JSON schema validator instance
    this._ajv = this.initAjv(ajv);
    this.addAjvFormats();

    // Initialize parent logger
    this._logger = this.initLogger();

    // initialize sequelize
    this.initSequelize();

    // Set cache implementation
    this._cache = this.initCache(cache);

    // Register AJV for schema validation
    this.registerAjv();

    this.addDirectusHooks();

    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGQUIT', this.shutdown.bind(this));
  }

  addDirectusHooks() {
    // Add Directus Message API flow creation if enabled
    if (this._config.util.directus?.generateFlows) {
      const directusUtil = new DirectusUtil(this._config, this._logger);
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
    // Initialize Swagger if enabled
    this.initSwagger();

    // Initialize module & API
    // Always initialize API after SwaggerUI
    this.initSystem();

    try {
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
      formats: ['date-time', 'url'],
    });
  }

  private initLogger() {
    return new Logger<ILogObj>({
      name: 'CitrineOS Logger',
      minLevel: systemConfig.logLevel,
      hideLogPositionForProduction: systemConfig.env === 'production',
      // Disable colors for cloud deployment as some cloude logging environments such as cloudwatch can not interpret colors
      stylePrettyLogs: process.env.DEPLOYMENT_TARGET !== 'cloud',
    });
  }

  private initSequelize() {
    sequelize.DefaultSequelizeInstance.getInstance(
      this._config,
      this._logger,
      true, // Force sync database
    );
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
      deasyncPromise(initSwagger(this._config, this._server));
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
      new sequelize.LocationRepository(this._config, this._logger),
      new sequelize.DeviceModelRepository(this._config, this._logger),
      this._logger,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = new MessageRouterImpl(
      this._config,
      this._cache,
      this._createSender(),
      this._createHandler(),
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
    [
      this.getModuleConfig(EventGroup.Certificates),
      this.getModuleConfig(EventGroup.Configuration),
      this.getModuleConfig(EventGroup.EVDriver),
      this.getModuleConfig(EventGroup.Monitoring),
      this.getModuleConfig(EventGroup.Reporting),
      this.getModuleConfig(EventGroup.SmartCharging),
      this.getModuleConfig(EventGroup.Transactions),
    ].forEach((moduleConfig) => {
      this.initModule(moduleConfig);
    });
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
      this.apis.push(
        new moduleConfig.ModuleApiClass(module, this._server, this._logger),
      );
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

  private getModuleConfig(eventGroup: EventGroup): ModuleConfig {
    switch (eventGroup) {
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
      case EventGroup.Transactions:
        return {
          ModuleClass: TransactionsModule,
          ModuleApiClass: TransactionsModuleApi,
          configModule: this._config.modules.transactions,
        };
      default:
        throw new Error('Unhandled module type: ' + eventGroup);
    }
  }

  private initSystem() {
    if (this.eventGroup === EventGroup.All) {
      this.initNetworkConnection();
      this.initAllModules();
    } else if (this.eventGroup === EventGroup.General) {
      this.initNetworkConnection();
    } else {
      const moduleConfig: ModuleConfig = this.getModuleConfig(this.eventGroup!);
      this.initModule(moduleConfig);
    }
    this.initOcpi();
  }

  private initOcpi() {
    // todo init properly
    const module = new OcpiModule(
      this._config,
      this._cache,
      this._createSender(),
      this._createHandler(),
      this._logger,
    );
    this.modules.push(module);
    this.apis.push(
      new CredentialsModuleApi(
        this._config,
        module,
        this._server,
        this._logger,
      ),
      new EverythingElseApi(module, this._server, this._logger),
      new VersionsModuleApi(this._config, module, this._server, this._logger),
    );
    // TODO: take actions to make sure module has correct subscriptions and log proof
    this._logger?.info(
      'CredentialsModuleApi, EverythingElseApi, VersionsModuleApi module started...',
    );
  }
}

new CitrineOSServer(process.env.APP_NAME as EventGroup, systemConfig)
  .run()
  .catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
