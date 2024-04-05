// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import "reflect-metadata";
import {
  type AbstractModuleApi,
  type BaseModule,
  CacheService,
  container,
  EventGroup,
  eventGroupFromString,
  type IAuthenticator,
  type ICache,
  type IMessageHandler,
  type IMessageSender,
  type IModule,
  type IModuleApi,
  inject,
  injectable,
  LoggerService,
  type SystemConfig,
  type SystemConfigInput,
  SystemConfigService,
} from "@citrineos/base";
import { MonitoringModule, MonitoringModuleApi } from "@citrineos/monitoring";
import {
  Authenticator,
  DirectusUtil,
  initSwagger,
  RabbitMqReceiver,
  RabbitMqSender,
  WebsocketNetworkConnection,
} from "@citrineos/util";
import { type JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fastify, { type FastifyInstance } from "fastify";
import {
  ConfigurationModule,
  ConfigurationModuleApi,
} from "@citrineos/configuration";
import {
  TransactionsModule,
  TransactionsModuleApi,
} from "@citrineos/transactions";
import {
  CertificatesModule,
  CertificatesModuleApi,
} from "@citrineos/certificates";
import { EVDriverModule, EVDriverModuleApi } from "@citrineos/evdriver";
import { ReportingModule, ReportingModuleApi } from "@citrineos/reporting";
import {
  SmartChargingModule,
  SmartChargingModuleApi,
} from "@citrineos/smartcharging";
import {DeviceModelRepository, LocationRepository, sequelize} from "@citrineos/data";
import {
  type FastifyRouteSchemaDef,
  type FastifySchemaCompiler,
  type FastifyValidationResult,
} from "fastify/types/schema";
import { MessageRouterImpl } from "@citrineos/ocpprouter";
import { defaultDockerConfig } from "./config/envs/docker";
import { defaultLocalConfig } from "./config/envs/local";

interface ModuleConfig {
  module: BaseModule | undefined;
  ModuleApiClass: new (...args: any[]) => AbstractModuleApi<any>;
  configModule: any; // todo type?
}

// @autoInjectable()
@injectable()
export class CitrineOSServer {
  /**
   * Fields
   */
  private readonly _config: SystemConfig;
  private readonly _server: FastifyInstance;
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
   * @param configService
   * @param cacheService
   * @param loggerService
   */
  // todo rename event group to type
  constructor(
    @inject(SystemConfigService)
    private readonly configService?: SystemConfigService,
    @inject(CacheService) private readonly cacheService?: CacheService,
    @inject(LoggerService) private readonly loggerService?: LoggerService,
    @inject(RabbitMqSender) private readonly rabbitMqSender?: RabbitMqSender,
    @inject(RabbitMqReceiver) private readonly rabbitMqReceiver?: RabbitMqReceiver,
    @inject(CertificatesModule) private readonly certificatesModule?: CertificatesModule,
    @inject(ConfigurationModule) private readonly configurationModule?: ConfigurationModule,
    @inject(EVDriverModule) private readonly evDriverModule?: EVDriverModule,
    @inject(MonitoringModule) private readonly monitoringModule?: MonitoringModule,
    @inject(ReportingModule) private readonly reportingModule?: ReportingModule,
    @inject(SmartChargingModule) private readonly smartChargingModule?: SmartChargingModule,
    @inject(TransactionsModule) private readonly transactionsModule?: TransactionsModule,
  ) {
    const appName = process.env.APP_NAME as string;

    // Set system config
    // TODO: Create and export config schemas for each util module, such as amqp, redis, kafka, etc, to avoid passing them possibly invalid configuration
    if (!configService?.systemConfig.util.messageBroker.amqp) {
      throw new Error(
        "This server implementation requires amqp configuration for rabbitMQ."
      );
    }
    this._config = this.configService?.systemConfig as SystemConfig;

    // Create server instance
    this._server = fastify().withTypeProvider<JsonSchemaToTsProvider>();

    // Add health check
    this.initHealthCheck();

    // Create Ajv JSON schema validator instance
    this._ajv = this.initAjv();
    this.addAjvFormats();

    // Force sync database
    this.forceDbSync();

    // Initialize Swagger if enabled
    this.initSwagger();

    // Add Directus Message API flow creation if enabled
    if (this._config.util.directus?.generateFlows) {
      const directusUtil = new DirectusUtil(
        this._config,
        this.loggerService?.logger
      );
      this._server.addHook(
        "onRoute",
        directusUtil.addDirectusMessageApiFlowsFastifyRouteHook.bind(
          directusUtil
        )
      );
      this._server.addHook("onReady", async () => {
        this.loggerService?.logger?.info(
          "Directus actions initialization finished"
        );
      });
    }

    // Register AJV for schema validation
    this.registerAjv();

    // Initialize module & API
    // Always initialize API after SwaggerUI
    this.initSystem(appName);

    process.on("SIGINT", this.shutdown.bind(this));
    process.on("SIGTERM", this.shutdown.bind(this));
    process.on("SIGQUIT", this.shutdown.bind(this));
  }

  private initHealthCheck() {
    this._server.get("/health", async () => {
      return { status: "healthy" };
    });
  }

  private initAjv(ajv?: Ajv) {
    return (
      ajv ||
      new Ajv({
        removeAdditional: "all",
        useDefaults: true,
        coerceTypes: "array",
        strict: false,
      })
    );
  }

  private addAjvFormats() {
    addFormats(this._ajv, {
      mode: "fast",
      formats: ["date-time"],
    });
  }

  private forceDbSync() {
    sequelize.DefaultSequelizeInstance.getInstance(
      this._config,
      this.loggerService?.logger,
      true
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
      routeSchema: FastifyRouteSchemaDef<any>
    ) => {
      return this._ajv?.compile(routeSchema.schema) as FastifyValidationResult;
    };
    this._server.setValidatorCompiler(fastifySchemaCompiler);
  }

  private initNetworkConnection() {
    this._authenticator = new Authenticator(
      this.cacheService?.cache as ICache,
      new LocationRepository(), // todo will need to dependency inject
      new DeviceModelRepository(),
      this.loggerService?.logger
    );

    const router = new MessageRouterImpl(
      this._config,
      this.cacheService?.cache as ICache,
      this._createSender(),
      this._createHandler(),
      async (identifier: string, message: string) => false,
      this.loggerService?.logger, // todo will need to dependency inject
      this._ajv
    );

    this._networkConnection = new WebsocketNetworkConnection(
      this._config,
      this.cacheService?.cache as ICache,
      this._authenticator,
      router,
      this.loggerService?.logger // todo will need to dependency inject
    );

    this.host = this.configService?.systemConfig.centralSystem.host;
    this.port = this.configService?.systemConfig.centralSystem.port;
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
      this.modules.push(moduleConfig.module as BaseModule)

      this.apis.push(
        new moduleConfig.ModuleApiClass(
            moduleConfig.module as BaseModule,
            this._server,
            this.loggerService?.logger
        )
      );
      // TODO: take actions to make sure module has correct subscriptions and log proof
      this.loggerService?.logger?.info(
        `${moduleConfig.module?.constructor.name} module started...`
      );
      if (this.eventGroup !== EventGroup.All) {
        this.host = moduleConfig.configModule.host as string;
        this.port = moduleConfig.configModule.port as number;
      }
    } else {
      throw new Error(`No config for ${this.eventGroup} module`);
    }
  }

  private getModuleConfig(appName: EventGroup): ModuleConfig {
    switch (appName) {
      case EventGroup.Certificates:
        return {
          module: this.certificatesModule,
          ModuleApiClass: CertificatesModuleApi,
          configModule: this._config.modules.certificates,
        };
      case EventGroup.Configuration:
        return {
          module: this.configurationModule,
          ModuleApiClass: ConfigurationModuleApi,
          configModule: this._config.modules.configuration,
        };
      case EventGroup.EVDriver:
        return {
          module: this.evDriverModule,
          ModuleApiClass: EVDriverModuleApi,
          configModule: this._config.modules.evdriver,
        };
      case EventGroup.Monitoring:
        return {
          module: this.monitoringModule,
          ModuleApiClass: MonitoringModuleApi,
          configModule: this._config.modules.monitoring,
        };
      case EventGroup.Reporting:
        return {
          module: this.reportingModule,
          ModuleApiClass: ReportingModuleApi,
          configModule: this._config.modules.reporting,
        };
      case EventGroup.SmartCharging:
        return {
          module: this.smartChargingModule,
          ModuleApiClass: SmartChargingModuleApi,
          configModule: this._config.modules.smartcharging,
        };
      case EventGroup.Transactions:
        return {
          module: this.transactionsModule,
          ModuleApiClass: TransactionsModuleApi,
          configModule: this._config.modules.transactions,
        };
      default:
        throw new Error("Unhandled module type: " + appName);
    }
  }

  private initSystem(appName: string) {
    this.eventGroup = eventGroupFromString(appName);
    if (this.eventGroup === EventGroup.All) {
      this.initAllModules();
      this.initNetworkConnection();
    } else if (this.eventGroup === EventGroup.General) {
      this.initNetworkConnection();
    } else {
      const moduleConfig: ModuleConfig = this.getModuleConfig(this.eventGroup);
      this.initModule(moduleConfig);
    }
  }

  protected _createSender(): IMessageSender {
    return this.rabbitMqSender as IMessageSender
  }

  protected _createHandler(): IMessageHandler {
    return this.rabbitMqReceiver as IMessageHandler;
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
      console.log("Exiting...");
      process.exit(1);
    }, 2000);
  }

  async run(): Promise<void> {
    try {
      await this._server
        .listen({
          host: this.host,
          port: this.port,
        })
        .then((address) => {
          this.loggerService?.logger?.info(`Server listening at ${address}`);
        })
        .catch((error) => {
          this.loggerService?.logger?.error(error);
          process.exit(1);
        });
      // TODO Push config to microservices
    } catch (error) {
      await Promise.reject(error);
    }
  }
}

container.register<SystemConfigInput>("SystemConfigInput", {
  useFactory: () => {
    let inputConfig: SystemConfigInput;
    switch (process.env.APP_ENV) {
      case "local":
        inputConfig = defaultLocalConfig;
        break;
      case "docker":
        inputConfig = defaultDockerConfig;
        break;
      default:
        throw new Error(`Invalid APP_ENV "${process.env.APP_ENV}"`);
    }
    return inputConfig;
  },
});

const server = container.resolve(CitrineOSServer);
server.run().catch((error: any) => {
  console.error(error);
  process.exit(1);
});
