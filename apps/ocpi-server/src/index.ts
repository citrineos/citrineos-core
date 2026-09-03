// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ICache, IModule } from '@citrineos/base';
import { EventGroup, eventGroupFromString } from '@citrineos/types';
import { MemoryCache, RedisCache } from '@citrineos/ocpp';
import type { AwilixContainer } from 'awilix';
import {
  type OcpiConfig,
  type OcpiModuleToken,
  buildOcpiContainer,
  DtoRouter,
  getDtoEventHandlerMetaData,
  getOcpiSystemConfig,
  OcpiServer,
} from '@citrineos/ocpi-base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { createDockerOcpiConfig } from './config/envs/docker.js';
import { createLocalOcpiConfig } from './config/envs/local.js';

export class CitrineOSServer {
  /**
   * Fields
   */
  private readonly modules: IModule[] = [];
  private ocpiConfig?: OcpiConfig;
  private _logger?: Logger<ILogObj>;
  private _cache?: ICache;
  private host?: string;
  private port?: number;
  private eventGroup?: EventGroup;
  private ocpiServer!: OcpiServer;
  private container!: AwilixContainer;

  /**
   * Constructor for the class.
   *
   * @param {EventGroup} appName - app type
   * @param {OcpiConfig} config - config
   * @param {FastifyInstance} server - optional Fastify server instance
   * @param {ICache} cache - cache
   */
  // todo rename event group to type
  constructor(appName: string) {
    // Set event group
    this.eventGroup = eventGroupFromString(appName);

    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGQUIT', this.shutdown.bind(this));
  }

  async initialize(): Promise<void> {
    // Initialize parent logger
    this.initLogger();

    // init cache
    this.initCache();

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

    this.ocpiServer.shutdown();

    setTimeout(() => {
      console.log('Exiting...');
      process.exit(1);
    }, 2000);
  }

  async initConfig() {
    switch (process.env.APP_ENV) {
      case 'docker':
        this.ocpiConfig = getOcpiSystemConfig(createDockerOcpiConfig());
        break;
      default:
        this.ocpiConfig = getOcpiSystemConfig(createLocalOcpiConfig());
    }
  }

  async run(): Promise<void> {
    try {
      await this.initConfig();
      await this.initialize();
      await this.startOcpiServer();
    } catch (error) {
      await Promise.reject(error);
    }
  }

  protected getOcpiModuleConfig(): OcpiModuleToken[] {
    return [
      'versionsModule',
      'credentialsModule',
      'commandsModule',
      'locationsModule',
      'sessionsModule',
      'chargingProfilesModule',
      'tariffsModule',
      'cdrsModule',
      'tokensModule',
    ];
  }

  private initLogger() {
    this._logger = new Logger<ILogObj>({
      name: 'CitrineOS Logger',
      minLevel: this.ocpiConfig!.logLevel,
      hideLogPositionForProduction: this.ocpiConfig!.env === 'production',
      // Disable colors for cloud deployment as some cloud logging environments such as cloudwatch can not interpret colors
      stylePrettyLogs: process.env.DEPLOYMENT_TARGET !== 'cloud',
    });
  }

  private initCache() {
    this._cache = this.ocpiConfig!.cache.redis
      ? new RedisCache({
          socket: {
            host: this.ocpiConfig!.cache.redis.host,
            port: this.ocpiConfig!.cache.redis.port,
          },
        })
      : new MemoryCache();
  }

  private async startOcpiServer() {
    this.container = buildOcpiContainer(this.ocpiConfig!, {
      logger: this._logger!,
      cache: this._cache!,
    });
    this.ocpiServer = new OcpiServer(this.ocpiConfig!, this.container, this.getOcpiModuleConfig());
    await this.ocpiServer.initialize();
    await this.initDtoRouter();
  }

  private async initDtoRouter() {
    const dtoRouter = this.container.resolve<DtoRouter>('dtoRouter');
    await dtoRouter.init();
    for (const module of this.ocpiServer.modules) {
      const eventHandlers = getDtoEventHandlerMetaData(module);
      for (const eventHandler of eventHandlers) {
        const subscribed = await dtoRouter.subscribe(
          eventHandler.eventId,
          eventHandler.eventType,
          eventHandler.objectType,
        );
        this._logger?.info(
          `Subscribed successfully (${subscribed}) to event: ${eventHandler.eventId} of type: ${eventHandler.eventType} for object: ${eventHandler.objectType}`,
        );
      }
    }
  }
}

new CitrineOSServer(process.env.APP_NAME as EventGroup).run().catch((error: any) => {
  console.error(error);
  process.exit(1);
});
