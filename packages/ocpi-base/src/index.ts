// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { RoutingControllersOptions } from 'routing-controllers';
import { useContainer } from 'routing-controllers';
import type { Constructable } from 'typedi';
import { Container } from 'typedi';
import { OcpiModule } from './model/OcpiModule.js';
import { KoaServer } from './util/KoaServer.js';
import Koa from 'koa';
import type { ICache } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { CacheWrapper } from './util/CacheWrapper.js';
// import { SessionBroadcaster } from './broadcaster/SessionBroadcaster';
// import { CdrBroadcaster } from './broadcaster/CdrBroadcaster';
import * as packageJson from '../package.json' with { type: 'json' };
import type { OcpiConfig } from './config/ocpi.types.js';
import { OcpiConfigToken } from './config/ocpi.types.js';
import type { IDtoModule } from './events/index.js';
import { OcpiGraphqlClient } from './graphql/index.js';
import { HealthController } from './util/KoaServerHealthController.js';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';

export * from './broadcaster/index.js';
export * from './mapper/index.js';
export * from './graphql/index.js';
export type { Version } from './model/Version.js';
export { BodyWithSchema } from './util/decorators/BodyWithSchema.js';
export { plainToClass } from './util/Util.js';
export { OcpiErrorResponse, buildOcpiErrorResponse } from './model/OcpiErrorResponse.js';
export type { AuthorizationInfo, AuthorizationInfoResponse } from './model/AuthorizationInfo.js';
export { TokensClientApi } from './trigger/TokensClientApi.js';
export { AuthorizationInfoAllowed } from './model/AuthorizationInfoAllowed.js';
export type { PostTokenParams } from './trigger/param/tokens/PostTokenParams.js';
export { UnsuccessfulRequestException } from './exception/UnsuccessfulRequestException.js';
export { NotFoundException } from './exception/NotFoundException.js';
export { FunctionalEndpointParams } from './util/decorators/FunctionEndpointParams.js';
export type { PaginatedOcpiParams } from './trigger/param/PaginatedOcpiParams.js';
export type { OcpiParams } from './trigger/util/OcpiParams.js';
export type { ChargingPreferences } from './model/ChargingPreferences.js';
export {
  ChargingPreferencesSchema,
  ChargingPreferencesSchemaName,
} from './model/ChargingPreferences.js';
export { PaginatedParams } from './controllers/param/PaginatedParams.js';
export { Paginated } from './util/decorators/Paginated.js';
export {
  OCPP_COMMAND_HANDLER,
  OCPPCommandHandler,
  OCPP1_6_CommandHandler,
  OCPP2_0_1_CommandHandler,
} from './util/ocppCommandHandlers/index.js';
export type { ChargingPreferencesResponse } from './model/ChargingPreferencesResponse.js';
export {
  ChargingPreferencesResponseSchema,
  ChargingPreferencesResponseSchemaName,
} from './model/ChargingPreferencesResponse.js';
export type { PaginatedSessionResponse, Session } from './model/Session.js';
export {
  PaginatedSessionResponseSchema,
  PaginatedSessionResponseSchemaName,
} from './model/Session.js';
export { Role } from './model/Role.js';
export { ImageCategory } from './model/ImageCategory.js';
export { ImageType } from './model/ImageType.js';
export { CountryCode } from './util/Util.js';
export { KoaServer } from './util/KoaServer.js';
export { InterfaceRole } from './model/InterfaceRole.js';
export { AlreadyRegisteredException } from './exception/AlreadyRegisteredException.js';
export { NotRegisteredException } from './exception/NotRegisteredException.js';
export { VersionsClientApi } from './trigger/VersionsClientApi.js';
// export { ChargingProfilesClientApi } from './trigger/ChargingProfilesClientApi';
export type { CredentialsDTO } from './model/DTO/CredentialsDTO.js';
export { CredentialsDTOSchema, CredentialsDTOSchemaName } from './model/DTO/CredentialsDTO.js';
export type { AdminCredentialsRequestDTO } from './model/DTO/AdminCredentialsRequestDTO.js';
export {
  AdminCredentialsRequestDTOSchema,
  AdminCredentialsRequestDTOSchemaName,
} from './model/DTO/AdminCredentialsRequestDTO.js';
export type { SingleTokenRequest, TokenDTO, TokenResponse } from './model/DTO/TokenDTO.js';
export {
  SingleTokenRequestSchema,
  TokenDTOSchema,
  TokenResponseSchema,
  TokenResponseSchemaName,
  TokenDTOSchemaName,
} from './model/DTO/TokenDTO.js';

export type { OcpiConfig, OcpiConfigInput } from './config/ocpi.types.js';
export { defineOcpiConfig } from './config/defineOcpiConfig.js';
export { getOcpiSystemConfig } from './config/loader.js';
export type { ServerConfig } from './config/ServerConfig.js';
export { Env } from './config/ServerConfig.js';

export type { CommandResponse } from './model/CommandResponse.js';
export type { ActiveChargingProfile } from './model/ActiveChargingProfile.js';
export type { ActiveChargingProfileResult } from './model/ActiveChargingProfileResult.js';
export type { ClearChargingProfileResult } from './model/ChargingprofilesClearProfileResult.js';
export type { ChargingProfileResponse } from './model/ChargingProfileResponse.js';
export type { ChargingProfileResult } from './model/ChargingProfileResult.js';
export { ChargingProfileResultType } from './model/ChargingProfileResult.js';
export {
  generateMockForSchema,
  generateMockOcpiPaginatedResponse,
  BaseController,
} from './controllers/BaseController.js';
export {
  buildOcpiPaginatedResponse,
  DEFAULT_OFFSET,
  DEFAULT_LIMIT,
} from './model/PaginatedResponse.js';
export { CommandType } from './model/CommandType.js';
export type { CancelReservation } from './model/CancelReservation.js';
export { CancelReservationSchema, CancelReservationSchemaName } from './model/CancelReservation.js';
export type { ReserveNow } from './model/ReserveNow.js';
export { ReserveNowSchema, ReserveNowSchemaName } from './model/ReserveNow.js';
export type { SetChargingProfile } from './model/SetChargingProfile.js';
export {
  SetChargingProfileSchema,
  SetChargingProfileSchemaName,
} from './model/SetChargingProfile.js';
export type { StartSession } from './model/StartSession.js';
export { StartSessionSchema, StartSessionSchemaName } from './model/StartSession.js';
export type { StopSession } from './model/StopSession.js';
export { StopSessionSchema, StopSessionSchemaName } from './model/StopSession.js';
export type { UnlockConnector } from './model/UnlockConnector.js';
export { UnlockConnectorSchema, UnlockConnectorSchemaName } from './model/UnlockConnector.js';
export type { OcpiCommandResponse } from './model/CommandResponse.js';
export { ModuleId } from './model/ModuleId.js';
export type { CredentialsResponse } from './model/CredentialsResponse.js';
export {
  CredentialsResponseSchema,
  CredentialsResponseSchemaName,
  buildCredentialsResponse,
} from './model/CredentialsResponse.js';
export type { OcpiEmptyResponse } from './model/OcpiEmptyResponse.js';
export {
  OcpiEmptyResponseSchema,
  OcpiEmptyResponseSchemaName,
  buildOcpiEmptyResponse,
} from './model/OcpiEmptyResponse.js';
export type { OcpiStringResponse } from './model/OcpiStringResponse.js';
export { VersionNumber } from './model/VersionNumber.js';
export type { VersionDetailsResponseDTO } from './model/DTO/VersionDetailsResponseDTO.js';
export type { VersionListResponseDTO } from './model/DTO/VersionListResponseDTO.js';
export {
  VersionListResponseDTOSchema,
  VersionListResponseDTOSchemaName,
} from './model/DTO/VersionListResponseDTO.js';
export { TokenType, TokenTypeSchema, TokenTypeSchemaName } from './model/TokenType.js';
export { WhitelistType } from './model/WhitelistType.js';
export type { VersionDetailsDTO } from './model/DTO/VersionDetailsDTO.js';
export type { VersionDTO } from './model/DTO/VersionDTO.js';
export {
  OcpiResponseSchema,
  OcpiResponseStatusCode,
  buildOcpiResponse,
} from './model/OcpiResponse.js';
export { OcpiModule } from './model/OcpiModule.js';
export { CommandResultType } from './model/CommandResult.js';
export { EnumQueryParam } from './util/decorators/EnumQueryParam.js';
export type { CommandResult } from './model/CommandResult.js';
export type {
  LocationDTO,
  LocationResponse,
  PaginatedLocationResponse,
} from './model/DTO/LocationDTO.js';
export {
  LocationResponseSchema,
  LocationResponseSchemaName,
  PaginatedLocationResponseSchema,
  PaginatedLocationResponseSchemaName,
} from './model/DTO/LocationDTO.js';
export type { EvseDTO, EvseResponse } from './model/DTO/EvseDTO.js';
export {
  UID_FORMAT,
  EXTRACT_EVSE_ID,
  EXTRACT_STATION_ID,
  EvseResponseSchema,
  EvseResponseSchemaName,
} from './model/DTO/EvseDTO.js';
export type { ConnectorDTO, ConnectorResponse } from './model/DTO/ConnectorDTO.js';
export {
  TEMPORARY_CONNECTOR_ID,
  ConnectorResponseSchema,
  ConnectorResponseSchemaName,
} from './model/DTO/ConnectorDTO.js';
export { LocationMapper } from './mapper/LocationMapper.js';
export { TokensMapper } from './mapper/TokensMapper.js';
export { SessionMapper } from './mapper/SessionMapper.js';
export { AsOcpiFunctionalEndpoint } from './util/decorators/AsOcpiFunctionalEndpoint.js';
export { MultipleTypes } from './util/decorators/MultipleTypes.js';
export { OcpiNamespace } from './util/OcpiNamespace.js';
export { OcpiLogger } from './util/OcpiLogger.js';
export { AsOcpiRegistrationEndpoint } from './util/decorators/AsOcpiRegistrationEndpoint.js';
export { OcpiHeaders } from './model/OcpiHeaders.js';
export { AuthToken } from './util/decorators/AuthToken.js';
export { VersionNumberParam } from './util/decorators/VersionNumberParam.js';
export { EnumParam } from './util/decorators/EnumParam.js';
export { OcpiExceptionHandler } from './util/middleware/OcpiExceptionHandler.js';
export { InvalidParamException } from './exception/InvalidParamException.js';
export { MissingParamException } from './exception/MissingParamException.js';
export { UnknownTokenException } from './exception/UnknownTokenException.js';
export { WrongClientAccessException } from './exception/WrongClientAccessException.js';
export { ChargingProfilesService } from './services/ChargingProfilesService.js';
// export { AsyncResponder } from './util/AsyncResponder.js';
export { AsAdminEndpoint } from './util/decorators/AsAdminEndpoint.js';

export { MessageSenderWrapper } from './util/MessageSenderWrapper.js';
export { MessageHandlerWrapper } from './util/MessageHandlerWrapper.js';
export { CacheWrapper } from './util/CacheWrapper.js';
export { ResponseGenerator } from './util/response.generator.js';
export { versionIdParam } from './util/decorators/VersionNumberParam.js';
export type { PutChargingProfileParams } from './trigger/param/charging.profiles/PutChargingProfileParams.js';
export { buildPutChargingProfileParams } from './trigger/param/charging.profiles/PutChargingProfileParams.js';

export {
  AUTH_CONTROLLER_COMPONENT,
  EVSE_COMPONENT,
  CONNECTOR_COMPONENT,
  TOKEN_READER_COMPONENT,
  AVAILABILITY_STATE_VARIABLE,
  UNKNOWN_ID,
  NOT_APPLICABLE,
  CREATE,
  UPDATE,
} from './util/Consts.js';

export { ResponseSchema, OpenAPI } from './openapi-spec-helper/decorators.js';
export { BaseClientApi } from './trigger/BaseClientApi.js';
export { LocationsClientApi } from './trigger/LocationsClientApi.js';

export { CommandsService } from './services/CommandsService.js';
export { CredentialsService } from './services/CredentialsService.js';
export { TokensService } from './services/TokensService.js';
// export { TokensAdminService } from './services/TokensAdminService.js';
export { LocationsService } from './services/LocationsService.js';
export { VersionService } from './services/VersionService.js';
export { SessionsService } from './services/SessionsService.js';
// export { AdminLocationsService } from './services/AdminLocationsService.js';

// Export AsyncJob types
export type {
  AsyncJobStatusResponse,
  AsyncJobRequest,
  AsyncJobPaginatedParams,
} from './types/asyncJob.types.js';
export { AsyncJobAction, AsyncJobName } from './types/asyncJob.types.js';

export { TariffsService } from './services/TariffsService.js';
export { TariffMapper } from './mapper/TariffMapper.js';

export { OcpiHttpHeader } from './util/OcpiHttpHeader.js';

export { CdrsService } from './services/CdrsService.js';
export type { PaginatedCdrResponse } from './model/Cdr.js';
export { BaseBroadcaster } from './broadcaster/BaseBroadcaster.js';
export type { PaginatedTariffResponse, TariffDTO } from './model/DTO/tariffs/TariffDTO.js';
export {
  PaginatedTariffResponseSchema,
  PaginatedTariffResponseSchemaName,
} from './model/DTO/tariffs/TariffDTO.js';
export { BodyWithExample } from './util/decorators/BodyWithExample.js';
export { CommandExecutor } from './util/CommandExecutor.js';
export type { PutTariffRequest } from './model/DTO/tariffs/PutTariffRequest.js';
export {
  PutTariffRequestSchema,
  PutTariffRequestSchemaName,
} from './model/DTO/tariffs/PutTariffRequest.js';
export type {
  AdminLocationDTO,
  AdminEvseDTO,
  AdminConnectorDTO,
} from './model/DTO/admin/AdminLocationDTO.js';
export {
  ChargingStationVariableAttributes,
  CONSTRUCT_CHARGING_STATION_VARIABLE_ATTRIBUTES_QUERY,
} from './model/variableattributes/ChargingStationVariableAttributes.js';
export {
  EvseVariableAttributes,
  CONSTRUCT_EVSE_VARIABLE_ATTRIBUTES_QUERY,
} from './model/variableattributes/EvseVariableAttributes.js';
export {
  ConnectorVariableAttributes,
  CONSTRUCT_CONNECTOR_VARIABLE_ATTRIBUTES_QUERY,
} from './model/variableattributes/ConnectorVariableAttributes.js';
export type { UnregisterClientRequestDTO } from './model/UnregisterClientRequestDTO.js';
export {
  UnregisterClientRequestDTOSchema,
  UnregisterClientRequestDTOSchemaName,
} from './model/UnregisterClientRequestDTO.js';
export * from './events/index.js';

useContainer(Container);

export { Container } from 'typedi';
export { getDtoEventHandlerMetaData } from './events/AsDtoEventHandler.js';
export { LocationsBroadcaster } from './broadcaster/LocationsBroadcaster.js';

export class OcpiServer extends KoaServer {
  private readonly ocpiConfig: OcpiConfig;
  private readonly cache: ICache;
  private readonly logger: Logger<ILogObj>;
  private _modules: (OcpiModule | IDtoModule)[] = [];
  get modules(): (OcpiModule | IDtoModule)[] {
    return this._modules;
  }

  private moduleList: Constructable<OcpiModule | IDtoModule>[] = [];

  constructor(
    ocpiConfig: OcpiConfig,
    cache: ICache,
    logger: Logger<ILogObj>,
    moduleList: Constructable<OcpiModule | IDtoModule>[],
  ) {
    super();

    this.ocpiConfig = ocpiConfig;
    this.cache = cache;
    this.logger = logger;
    this.moduleList = moduleList;
    this.initContainer();
  }

  public async initialize() {
    for (const moduleListElement of this.moduleList) {
      const constructedModule = Container.get(moduleListElement) as OcpiModule & IDtoModule;
      if (constructedModule) {
        if (constructedModule.init) {
          await constructedModule.init();
        }
        if (constructedModule.initHandlers) {
          await constructedModule.initHandlers();
        }
        this._modules.push(constructedModule);
      }
    }
    this.initKoaServer();
  }

  private initKoaServer() {
    try {
      this.koa = new Koa();
      const controllers = this._modules.map((module) => (module as OcpiModule).getController());
      const options: RoutingControllersOptions = {
        controllers: [...controllers, HealthController],
        routePrefix: '/ocpi',
        middlewares: [],
        defaultErrorHandler: false,
      } as RoutingControllersOptions;
      this.initApp(options);

      this.initKoaSwagger(
        {
          title: 'CitrineOS OCPI 2.2.1',
          version: packageJson.default.version,
        },
        [
          {
            url: '/ocpi',
          },
        ],
      );
      this.run(this.ocpiConfig.ocpiServer.host, this.ocpiConfig.ocpiServer.port);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }

  private initContainer() {
    Container.set(OcpiConfigToken, this.ocpiConfig);
    Container.set(CacheWrapper, new CacheWrapper(this.cache));
    Container.set(Logger, this.logger);

    Container.set(
      OcpiGraphqlClient,
      new OcpiGraphqlClient(this.ocpiConfig.graphql.endpoint, this.ocpiConfig.graphql.headers),
    );

    const ajv = new Ajv({
      removeAdditional: 'all',
      useDefaults: true,
      coerceTypes: 'array',
      strict: false,
    });
    addFormats.default(ajv, {
      mode: 'fast',
      formats: ['date-time'],
    });
    Container.set(Ajv, ajv);

    this.onContainerInitialized();
  }

  private onContainerInitialized() {
    // Container.get(SessionBroadcaster); // init session broadcaster
    // Container.get(CdrBroadcaster);
  }
}

export { OcpiConfigToken };

export { CommandResponseSchema, CommandResponseSchemaName } from './model/CommandResponse.js';
export { ChargingProfileResponseSchemaName } from './model/ChargingProfileResponse.js';
export { ChargingProfileResponseSchema } from './model/ChargingProfileResponse.js';

export { PaginatedCdrResponseSchema, PaginatedCdrResponseSchemaName } from './model/Cdr.js';

// OCPI modules (folded in from the former 03_Modules/* packages).
// Must remain the last export so foundational symbols (OcpiModule,
// AbstractDtoModule, decorators, ...) are initialized before the module
// classes that extend/decorate them evaluate within the import cycle.
export * from './modules/index.js';
