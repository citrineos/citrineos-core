// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AwilixContainer, BuildResolver, Constructor, DisposableResolver } from 'awilix';
import { asClass, asFunction, asValue, createContainer, InjectionMode } from 'awilix';
import type { ClassConstructor, IocAdapter } from 'routing-controllers';
import { useContainer } from 'routing-controllers';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import type { ICache } from '@citrineos/base';
import type { ILogObj, Logger } from 'tslog';

import type { OcpiConfig } from './config/ocpi.types.js';
import { CacheWrapper } from './util/CacheWrapper.js';
import { OcpiGraphqlClient } from './graphql/OcpiGraphqlClient.js';

import { ConnectorMapper, EvseMapper, LocationMapper } from './mapper/LocationMapper.js';
import { TokensMapper } from './mapper/TokensMapper.js';
import { SessionMapper } from './mapper/SessionMapper.js';
import { CdrMapper } from './mapper/CdrMapper.js';

import { CdrsService } from './services/CdrsService.js';
import { ChargingProfilesService } from './services/ChargingProfilesService.js';
import { CommandsService } from './services/CommandsService.js';
import { CredentialsService } from './services/CredentialsService.js';
import { LocationsService } from './services/LocationsService.js';
import { SessionsService } from './services/SessionsService.js';
import { TariffsService } from './services/TariffsService.js';
import { TokensService } from './services/TokensService.js';
import { VersionService } from './services/VersionService.js';
import { CommandExecutor } from './util/CommandExecutor.js';

import { CdrsClientApi } from './trigger/CdrsClientApi.js';
import { CommandsClientApi } from './trigger/CommandsClientApi.js';
import { CredentialsClientApi } from './trigger/CredentialsClientApi.js';
import { LocationsClientApi } from './trigger/LocationsClientApi.js';
import { SessionsClientApi } from './trigger/SessionsClientApi.js';
import { TariffsClientApi } from './trigger/TariffsClientApi.js';
import { TokensClientApi } from './trigger/TokensClientApi.js';
import { VersionsClientApi } from './trigger/VersionsClientApi.js';

import { CdrBroadcaster } from './broadcaster/CdrBroadcaster.js';
import { LocationsBroadcaster } from './broadcaster/LocationsBroadcaster.js';
import { SessionBroadcaster } from './broadcaster/SessionBroadcaster.js';
import { TariffsBroadcaster } from './broadcaster/TariffsBroadcaster.js';

import { AdminAuthMiddleware } from './util/middleware/AdminAuthMiddleware.js';
import { AuthMiddleware, RegistrationAuthMiddleware } from './util/middleware/AuthMiddleware.js';
import { HttpExceptionHandler } from './util/middleware/HttpExceptionHandler.js';
import { OcpiExceptionHandler } from './util/middleware/OcpiExceptionHandler.js';
import { OcpiHeaderMiddleware } from './util/middleware/OcpiHeaderMiddleware.js';
import { PaginatedMiddleware } from './util/middleware/PaginatedMiddleware.js';
import { UniqueMessageIdsMiddleware } from './util/middleware/UniqueMessageIdsMiddleware.js';

import type { OCPPCommandHandler } from './util/ocppCommandHandlers/base.js';
import { OCPP1_6_CommandHandler } from './util/ocppCommandHandlers/OCPP1_6_CommandHandler.js';
import { OCPP2_0_1_CommandHandler } from './util/ocppCommandHandlers/OCPP2_0_1_CommandHandler.js';

import type { DtoEventReceiverFactory } from './events/types.js';
import { PgNotifyEventSubscriber } from './events/pgNotify/subscriber.js';
import { RabbitMqDtoReceiver } from './events/rabbitMQ/receiver.js';
import { RabbitMqDtoSender } from './events/rabbitMQ/sender.js';
import { DtoRouter } from './modules/DtoRouter/router/router.js';

import { CdrsModule } from './modules/Cdrs/index.js';
import { CdrsModuleApi } from './modules/Cdrs/module/CdrsModuleApi.js';
import { ChargingProfilesModule } from './modules/ChargingProfiles/index.js';
import { ChargingProfilesModuleApi } from './modules/ChargingProfiles/module/ChargingProfilesModuleApi.js';
import { CommandsModule } from './modules/Commands/index.js';
import { CommandsModuleApi } from './modules/Commands/module/CommandsModuleApi.js';
import { CredentialsModule } from './modules/Credentials/index.js';
import { CredentialsModuleApi } from './modules/Credentials/module/CredentialsModuleApi.js';
import { LocationsModule } from './modules/Locations/index.js';
import { LocationsModuleApi } from './modules/Locations/module/LocationsModuleApi.js';
import { SessionsModule } from './modules/Sessions/index.js';
import { SessionsModuleApi } from './modules/Sessions/module/SessionsModuleApi.js';
import { TariffsModule } from './modules/Tariffs/index.js';
import { TariffsModuleApi } from './modules/Tariffs/module/TariffsModuleApi.js';
import { TokensModule } from './modules/Tokens/index.js';
import { TokensModuleApi } from './modules/Tokens/module/TokensModuleApi.js';
import { VersionsModule } from './modules/Versions/index.js';
import { VersionsModuleApi } from './modules/Versions/module/VersionsModuleApi.js';
import { HealthController } from './util/KoaServerHealthController.js';

export type OcpiPrebuilt = {
  logger: Logger<ILogObj>;
  cache: ICache;
};

const classTokens = new WeakMap<object, string>();

function singletonClass<T>(
  token: string,
  Class: Constructor<T>,
): BuildResolver<T> & DisposableResolver<T> {
  classTokens.set(Class, token);
  return asClass(Class).singleton();
}

function createIocAdapter(container: AwilixContainer): IocAdapter {
  return {
    get<T>(SomeClass: ClassConstructor<T>): T {
      const token = classTokens.get(SomeClass);
      if (!token) {
        throw new Error(
          `${SomeClass.name} is not registered in the OCPI container; register it in buildOcpiContainer`,
        );
      }
      return container.resolve<T>(token);
    },
  };
}

export function buildOcpiContainer(config: OcpiConfig, prebuilt: OcpiPrebuilt): AwilixContainer {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  registerPrimitives(container, config, prebuilt);
  registerMappers(container);
  registerClientApis(container);
  registerServices(container);
  registerBroadcasters(container);
  registerMiddleware(container);
  registerCommandHandlers(container);
  registerEvents(container);
  registerModules(container);
  registerModuleApis(container);

  useContainer(createIocAdapter(container));

  return container;
}

function registerPrimitives(
  container: AwilixContainer,
  config: OcpiConfig,
  prebuilt: OcpiPrebuilt,
): void {
  const { logger, cache } = prebuilt;

  container.register({
    config: asValue(config),
    logger: asValue(logger),
    cache: asValue(cache),
    cacheWrapper: asFunction(({ cache: ocpiCache }) => new CacheWrapper(ocpiCache)).singleton(),

    ajv: asFunction(() => {
      const ajv = new Ajv({
        removeAdditional: 'all',
        useDefaults: true,
        coerceTypes: 'array',
        strict: false,
      });
      addFormats.default(ajv, { mode: 'fast', formats: ['date-time'] });
      return ajv;
    }).singleton(),

    ocpiGraphqlClient: asFunction(
      ({ config: ocpiConfig }) =>
        new OcpiGraphqlClient(ocpiConfig.graphql.endpoint, ocpiConfig.graphql.headers),
    ).singleton(),
  });
}

function registerMappers(container: AwilixContainer): void {
  container.register({
    connectorMapper: singletonClass('connectorMapper', ConnectorMapper),
    evseMapper: singletonClass('evseMapper', EvseMapper),
    locationMapper: singletonClass('locationMapper', LocationMapper),
    tokensMapper: singletonClass('tokensMapper', TokensMapper),
    sessionMapper: singletonClass('sessionMapper', SessionMapper),
    cdrMapper: singletonClass('cdrMapper', CdrMapper),
  });
}

function registerClientApis(container: AwilixContainer): void {
  container.register({
    cdrsClientApi: singletonClass('cdrsClientApi', CdrsClientApi),
    commandsClientApi: singletonClass('commandsClientApi', CommandsClientApi),
    credentialsClientApi: singletonClass('credentialsClientApi', CredentialsClientApi),
    locationsClientApi: singletonClass('locationsClientApi', LocationsClientApi),
    sessionsClientApi: singletonClass('sessionsClientApi', SessionsClientApi),
    tariffsClientApi: singletonClass('tariffsClientApi', TariffsClientApi),
    tokensClientApi: singletonClass('tokensClientApi', TokensClientApi),
    versionsClientApi: singletonClass('versionsClientApi', VersionsClientApi),
  });
}

function registerServices(container: AwilixContainer): void {
  container.register({
    cdrsService: singletonClass('cdrsService', CdrsService),
    chargingProfilesService: singletonClass('chargingProfilesService', ChargingProfilesService),
    commandsService: singletonClass('commandsService', CommandsService),
    credentialsService: singletonClass('credentialsService', CredentialsService),
    locationsService: singletonClass('locationsService', LocationsService),
    sessionsService: singletonClass('sessionsService', SessionsService),
    tariffsService: singletonClass('tariffsService', TariffsService),
    tokensService: singletonClass('tokensService', TokensService),
    versionService: singletonClass('versionService', VersionService),
    commandExecutor: singletonClass('commandExecutor', CommandExecutor),
  });
}

function registerBroadcasters(container: AwilixContainer): void {
  container.register({
    cdrBroadcaster: singletonClass('cdrBroadcaster', CdrBroadcaster),
    locationsBroadcaster: singletonClass('locationsBroadcaster', LocationsBroadcaster),
    sessionBroadcaster: singletonClass('sessionBroadcaster', SessionBroadcaster),
    tariffsBroadcaster: singletonClass('tariffsBroadcaster', TariffsBroadcaster),
  });
}

function registerMiddleware(container: AwilixContainer): void {
  container.register({
    adminAuthMiddleware: singletonClass('adminAuthMiddleware', AdminAuthMiddleware),
    authMiddleware: singletonClass('authMiddleware', AuthMiddleware),
    registrationAuthMiddleware: singletonClass(
      'registrationAuthMiddleware',
      RegistrationAuthMiddleware,
    ),
    httpExceptionHandler: singletonClass('httpExceptionHandler', HttpExceptionHandler),
    ocpiExceptionHandler: singletonClass('ocpiExceptionHandler', OcpiExceptionHandler),
    ocpiHeaderMiddleware: singletonClass('ocpiHeaderMiddleware', OcpiHeaderMiddleware),
    paginatedMiddleware: singletonClass('paginatedMiddleware', PaginatedMiddleware),
    uniqueMessageIdsMiddleware: singletonClass(
      'uniqueMessageIdsMiddleware',
      UniqueMessageIdsMiddleware,
    ),
  });
}

function registerCommandHandlers(container: AwilixContainer): void {
  container.register({
    ocpp16CommandHandler: singletonClass('ocpp16CommandHandler', OCPP1_6_CommandHandler),
    ocpp201CommandHandler: singletonClass('ocpp201CommandHandler', OCPP2_0_1_CommandHandler),

    handlers: asFunction(
      ({ ocpp16CommandHandler, ocpp201CommandHandler }): OCPPCommandHandler[] => [
        ocpp16CommandHandler,
        ocpp201CommandHandler,
      ],
    ).singleton(),
  });
}

function registerEvents(container: AwilixContainer): void {
  container.register({
    rabbitMqDtoSender: singletonClass('rabbitMqDtoSender', RabbitMqDtoSender),
    pgNotifyEventSubscriber: singletonClass('pgNotifyEventSubscriber', PgNotifyEventSubscriber),
    dtoRouter: singletonClass('dtoRouter', DtoRouter),

    dtoEventReceiverFactory: asFunction(
      ({ config, logger }): DtoEventReceiverFactory =>
        () =>
          new RabbitMqDtoReceiver(config, logger),
    ).singleton(),
  });
}

const OCPI_MODULES = {
  cdrsModule: CdrsModule,
  chargingProfilesModule: ChargingProfilesModule,
  commandsModule: CommandsModule,
  credentialsModule: CredentialsModule,
  locationsModule: LocationsModule,
  sessionsModule: SessionsModule,
  tariffsModule: TariffsModule,
  tokensModule: TokensModule,
  versionsModule: VersionsModule,
};

export type OcpiModuleToken = keyof typeof OCPI_MODULES;

function registerModules(container: AwilixContainer): void {
  for (const [token, Module] of Object.entries<Constructor<object>>(OCPI_MODULES)) {
    container.register({ [token]: singletonClass(token, Module) });
  }
}

function registerModuleApis(container: AwilixContainer): void {
  container.register({
    cdrsModuleApi: singletonClass('cdrsModuleApi', CdrsModuleApi),
    chargingProfilesModuleApi: singletonClass(
      'chargingProfilesModuleApi',
      ChargingProfilesModuleApi,
    ),
    commandsModuleApi: singletonClass('commandsModuleApi', CommandsModuleApi),
    credentialsModuleApi: singletonClass('credentialsModuleApi', CredentialsModuleApi),
    locationsModuleApi: singletonClass('locationsModuleApi', LocationsModuleApi),
    sessionsModuleApi: singletonClass('sessionsModuleApi', SessionsModuleApi),
    tariffsModuleApi: singletonClass('tariffsModuleApi', TariffsModuleApi),
    tokensModuleApi: singletonClass('tokensModuleApi', TokensModuleApi),
    versionsModuleApi: singletonClass('versionsModuleApi', VersionsModuleApi),
    healthController: singletonClass('healthController', HealthController),
  });
}
