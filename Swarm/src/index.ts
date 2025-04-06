// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable @typescript-eslint/prefer-readonly */
/* eslint-disable @typescript-eslint/indent */
/* eslint-disable @typescript-eslint/semi */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/consistent-type-imports */
import {
  Ajv,
  EventGroup,
  IAuthenticator,
  ICache,
  IMessageHandler,
  IMessageSender,
  IModule,
  IModuleApi,
  SystemConfig,
} from '@citrineos/base';
import { MonitoringModule, MonitoringOcpp201Api } from '@citrineos/monitoring';
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
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import addFormats from 'ajv-formats';
import fastify, { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { systemConfig } from './config';
import { ConfigurationModule, ConfigurationOcpp201Api } from '@citrineos/configuration';
import { TransactionsModule, TransactionsOcpp201Api } from '@citrineos/transactions';
import { CertificatesModule, CertificatesOcpp201Api } from '@citrineos/certificates';
import { EVDriverModule, EVDriverOcpp201Api } from '@citrineos/evdriver';
import { AdminApi, MessageRouterImpl } from '@citrineos/ocpprouter';
import { ReportingModule, ReportingOcpp201Api } from '@citrineos/reporting';
import { SmartChargingModule, SmartChargingOcpp201Api } from '@citrineos/smartcharging';
import { sequelize } from '@citrineos/data';
import { TenantModule, TenantDataApi } from '@citrineos/tenant';
import { UnknownStationFilter } from '@citrineos/util/dist/networkconnection/authenticator/UnknownStationFilter';
import { ConnectedStationFilter } from '@citrineos/util/dist/networkconnection/authenticator/ConnectedStationFilter';
import { BasicAuthenticationFilter } from '@citrineos/util/dist/networkconnection/authenticator/BasicAuthenticationFilter';

class CitrineOSServer {
  /**
   * Fields
   */
  private _config: SystemConfig;
  private _authenticator: IAuthenticator;
  private _networkConnection: WebsocketNetworkConnection;
  private _logger: Logger<ILogObj>;
  private _server: FastifyInstance;
  private _cache: ICache;
  private _ajv: Ajv;

  /**
   * Constructor for the class.
   *
   * @param {FastifyInstance} server - optional Fastify server instance
   * @param {Ajv} ajv - optional Ajv JSON schema validator instance
   */
  constructor(config: SystemConfig, server?: FastifyInstance, ajv?: Ajv, cache?: ICache) {
    // Set system config
    // TODO: Create and export config schemas for each util module, such as amqp, redis, kafka, etc, to avoid passing them possibly invalid configuration
    if (!config.util.messageBroker.amqp) {
      throw new Error('This server implementation requires amqp configuration for rabbitMQ.');
    }
    this._config = config;

    // Create server instance
    this._server = server || fastify().withTypeProvider<JsonSchemaToTsProvider>();

    // Add health check
    this._server.get('/health', async () => ({ status: 'healthy' }));

    // Create Ajv JSON schema validator instance
    this._ajv =
      ajv ||
      new Ajv({
        removeAdditional: 'all',
        useDefaults: true,
        coerceTypes: 'array',
        strict: false,
      });
    addFormats(this._ajv, { mode: 'fast', formats: ['date-time'] });

    // Initialize parent logger
    this._logger = new Logger<ILogObj>({
      name: 'CitrineOS Logger',
      minLevel: systemConfig.logLevel,
      hideLogPositionForProduction: systemConfig.env === 'production',
      // Disable colors for cloud deployment as some cloude logging environments such as cloudwatch can not interpret colors
      stylePrettyLogs: process.env.DEPLOYMENT_TARGET != 'cloud',
    });

    // Force sync database
    sequelize.DefaultSequelizeInstance.getInstance(this._config, this._logger, true);

    // Set cache implementation
    this._cache =
      cache ||
      (this._config.util.cache.redis
        ? new RedisCache({
            socket: {
              host: this._config.util.cache.redis.host,
              port: this._config.util.cache.redis.port,
            },
          })
        : new MemoryCache());

    // Initialize Swagger if enabled
    if (this._config.util.swagger) {
      initSwagger(this._config, this._server);
    }

    // Add Directus Message API flow creation if enabled
    if (this._config.util.fileAccess?.directus?.generateFlows) {
      const directusUtil = new DirectusUtil(this._config, this._logger);
      this._server.addHook(
        'onRoute',
        directusUtil.addDirectusMessageApiFlowsFastifyRouteHook.bind(directusUtil),
      );
      this._server.addHook('onReady', async () => {
        this._logger.info('Directus actions initialization finished');
      });
    }

    // Register AJV for schema validation
    this._server.setValidatorCompiler(({ schema, method, url, httpPart }) =>
      this._ajv.compile(schema),
    );

    this._authenticator = new Authenticator(
      new UnknownStationFilter(
        new sequelize.LocationRepository(this._config, this._logger),
        this._logger,
      ),
      new ConnectedStationFilter(this._cache, this._logger),
      new BasicAuthenticationFilter(
        new sequelize.DeviceModelRepository(this._config, this._logger),
        this._logger,
      ),
      this._logger,
    );

    const router = new MessageRouterImpl(
      this._config,
      this._cache,
      this._createSender(),
      this._createHandler(),
      async (identifier: string, message: string) => false,
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

    const api = new AdminApi(router, this._server, this._logger);

    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGQUIT', this.shutdown.bind(this));
  }

  protected _createSender(): IMessageSender {
    return new RabbitMqSender(this._config, this._logger);
  }

  protected _createHandler(): IMessageHandler {
    return new RabbitMqReceiver(this._config, this._logger);
  }

  shutdown() {
    // Shut down ocpp router
    this._networkConnection.shutdown();

    // Shutdown server
    this._server.close();

    setTimeout(() => {
      console.log('Exiting...');
      process.exit(1);
    }, 2000);
  }

  async run(): Promise<void> {
    try {
      await this._server
        .listen({
          port: this._config.centralSystem.port,
          host: this._config.centralSystem.host,
        })
        .then((address) => {
          this._logger.info(`Server listening at ${address}`);
        })
        .catch((error) => {
          this._logger.error(error);
          process.exit(1);
        });
      // TODO Push config to microservices
    } catch (error) {
      await Promise.reject(error);
    }
  }
}

class ModuleService {
  /**
   * Fields
   */
  private _config: SystemConfig;
  private _module: IModule;
  private _api: IModuleApi;
  private _logger: Logger<ILogObj>;
  private _server: FastifyInstance;
  private _ajv: Ajv;
  private _cache: ICache;
  private _host: string;
  private _port: number;

  /**
   * Constructor for the class.
   *
   * @param {FastifyInstance} server - optional Fastify server instance
   * @param {Ajv} ajv - optional Ajv JSON schema validator instance
   */
  constructor(
    config: SystemConfig,
    appName: string,
    server?: FastifyInstance,
    ajv?: Ajv,
    cache?: ICache,
  ) {
    // Set system config
    // TODO: Create and export config schemas for each util module, such as amqp, redis, kafka, etc, to avoid passing them possibly invalid configuration
    if (!config.util.messageBroker.amqp) {
      throw new Error('This server implementation requires amqp configuration for rabbitMQ.');
    }
    this._config = config;

    // Create server instance
    this._server = server || fastify().withTypeProvider<JsonSchemaToTsProvider>();

    // Add health check
    this._server.get('/health', async () => ({ status: 'healthy' }));

    // Create Ajv JSON schema validator instance
    this._ajv =
      ajv ||
      new Ajv({
        removeAdditional: 'all',
        useDefaults: true,
        coerceTypes: 'array',
        strict: false,
      });
    addFormats(this._ajv, { mode: 'fast', formats: ['date-time'] });

    // Initialize parent logger
    this._logger = new Logger<ILogObj>({
      name: 'CitrineOS Logger',
      minLevel: systemConfig.logLevel,
      hideLogPositionForProduction: systemConfig.env === 'production',
    });

    // Set cache implementation
    this._cache =
      cache ||
      (this._config.util.cache.redis
        ? new RedisCache({
            socket: {
              host: this._config.util.cache.redis.host,
              port: this._config.util.cache.redis.port,
            },
          })
        : new MemoryCache());

    // Initialize Swagger if enabled
    if (this._config.util.swagger) {
      initSwagger(this._config, this._server);
    }

    // Add Directus Message API flow creation if enabled
    if (this._config.util.fileAccess?.directus?.generateFlows) {
      const directusUtil = new DirectusUtil(this._config, this._logger);
      this._server.addHook(
        'onRoute',
        directusUtil.addDirectusMessageApiFlowsFastifyRouteHook.bind(directusUtil),
      );
    }

    // Register AJV for schema validation
    this._server.setValidatorCompiler(({ schema, method, url, httpPart }) =>
      this._ajv.compile(schema),
    );

    // Initialize module & API
    // Always initialize API after SwaggerUI
    switch (appName) {
      case EventGroup.Certificates:
        if (this._config.modules.certificates) {
          this._module = new CertificatesModule(
            this._config,
            this._cache,
            this._createSender(),
            this._createHandler(),
            this._logger,
          );
          this._api = new CertificatesOcpp201Api(
            this._module as CertificatesModule,
            this._server,
            this._logger,
          );
          // TODO: take actions to make sure module has correct subscriptions and log proof
          this._logger.info('Certificates module started...');
          this._host = this._config.modules.certificates.host as string;
          this._port = this._config.modules.certificates.port as number;
          break;
        } else throw new Error('No config for Certificates module');
      case EventGroup.Configuration:
        if (this._config.modules.configuration) {
          this._module = new ConfigurationModule(
            this._config,
            this._cache,
            this._createSender(),
            this._createHandler(),
            this._logger,
          );
          this._api = new ConfigurationOcpp201Api(
            this._module as ConfigurationModule,
            this._server,
            this._logger,
          );
          // TODO: take actions to make sure module has correct subscriptions and log proof
          this._logger.info('Configuration module started...');
          this._host = this._config.modules.configuration.host as string;
          this._port = this._config.modules.configuration.port as number;
          break;
        } else throw new Error('No config for Configuration module');
      case EventGroup.EVDriver:
        if (this._config.modules.evdriver) {
          this._module = new EVDriverModule(
            this._config,
            this._cache,
            this._createSender(),
            this._createHandler(),
            this._logger,
          );
          this._api = new EVDriverOcpp201Api(
            this._module as EVDriverModule,
            this._server,
            this._logger,
          );
          // TODO: take actions to make sure module has correct subscriptions and log proof
          this._logger.info('EVDriver module started...');
          this._host = this._config.modules.evdriver.host as string;
          this._port = this._config.modules.evdriver.port as number;
          break;
        } else throw new Error('No config for EVDriver module');
      case EventGroup.Monitoring:
        if (this._config.modules.monitoring) {
          this._module = new MonitoringModule(
            this._config,
            this._cache,
            this._createSender(),
            this._createHandler(),
            this._logger,
          );
          this._api = new MonitoringOcpp201Api(
            this._module as MonitoringModule,
            this._server,
            this._logger,
          );
          // TODO: take actions to make sure module has correct subscriptions and log proof
          this._logger.info('Monitoring module started...');
          this._host = this._config.modules.monitoring.host as string;
          this._port = this._config.modules.monitoring.port as number;
          break;
        } else throw new Error('No config for Monitoring module');
      case EventGroup.Reporting:
        if (this._config.modules.reporting) {
          this._module = new ReportingModule(
            this._config,
            this._cache,
            this._createSender(),
            this._createHandler(),
            this._logger,
          );
          this._api = new ReportingOcpp201Api(
            this._module as ReportingModule,
            this._server,
            this._logger,
          );
          // TODO: take actions to make sure module has correct subscriptions and log proof
          this._logger.info('Reporting module started...');
          this._host = this._config.modules.reporting.host as string;
          this._port = this._config.modules.reporting.port as number;
          break;
        } else throw new Error('No config for Reporting module');
      case EventGroup.SmartCharging:
        if (this._config.modules.smartcharging) {
          this._module = new SmartChargingModule(
            this._config,
            this._cache,
            this._createSender(),
            this._createHandler(),
            this._logger,
          );
          this._api = new SmartChargingOcpp201Api(
            this._module as SmartChargingModule,
            this._server,
            this._logger,
          );
          // TODO: take actions to make sure module has correct subscriptions and log proof
          this._logger.info('SmartCharging module started...');
          this._host = this._config.modules.smartcharging.host as string;
          this._port = this._config.modules.smartcharging.port as number;
          break;
        } else throw new Error('No config for SmartCharging module');
      case EventGroup.Tenant:
        if (this._config.modules.tenant) {
          this._module = new TenantModule(
            this._config,
            this._cache,
            this._createSender(),
            this._createHandler(),
            this._logger,
          );
          this._api = new TenantDataApi(this._module as TenantModule, this._server, this._logger);
          // TODO: take actions to make sure module has correct subscriptions and log proof
          this._logger.info('Tenant module started...');
          this._host = this._config.modules.tenant.host as string;
          this._port = this._config.modules.tenant.port as number;
          break;
        } else throw new Error('No config for Tenant module');
      case EventGroup.Transactions:
        if (this._config.modules.transactions) {
          this._module = new TransactionsModule(
            this._config,
            this._cache,
            this._createSender(),
            this._createHandler(),
            this._logger,
          );
          this._api = new TransactionsOcpp201Api(
            this._module as TransactionsModule,
            this._server,
            this._logger,
          );
          // TODO: take actions to make sure module has correct subscriptions and log proof
          this._logger.info('Transactions module started...');
          this._host = this._config.modules.transactions.host as string;
          this._port = this._config.modules.transactions.port as number;
          break;
        } else throw new Error('No config for Transactions module');
      default:
        throw new Error('Unhandled module type: ' + appName);
    }

    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGQUIT', this.shutdown.bind(this));
  }

  protected _createSender(): IMessageSender {
    return new RabbitMqSender(this._config, this._logger);
  }

  protected _createHandler(): IMessageHandler {
    return new RabbitMqReceiver(this._config, this._logger);
  }

  shutdown() {
    // Shut down all module
    this._module.shutdown();

    // Shutdown server
    this._server.close();

    setTimeout(() => {
      console.log('Exiting...');
      process.exit(1);
    }, 2000);
  }

  async run(): Promise<void> {
    try {
      await this._server
        .listen({
          port: this._port,
          host: this._host,
        })
        .then((address) => {
          this._logger.info(`Server listening at ${address}`);
        })
        .catch((error) => {
          this._logger.error(error);
          process.exit(1);
        });
    } catch (error) {
      await Promise.reject(error);
    }
  }
}

if (process.env.APP_NAME === EventGroup.General) {
  new CitrineOSServer(systemConfig).run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else if (process.env.APP_NAME) {
  new ModuleService(systemConfig, process.env.APP_NAME).run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  throw new Error('Invalid APP_NAME environment variable "${process.env.APP_NAME}"');
}
