// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {ILogObj, Logger} from 'tslog';
import {OcpiModule} from './module';
import {AbstractModuleApi, HttpMethod, Namespace} from '@citrineos/base';
import {FastifyInstance, FastifyRequest} from 'fastify';
import {AsOcpiEndpoint} from '../../util/as.ocpi.endpoint';
import {OcpiResponse} from '../../model/OcpiResponse';
import {Connector} from '../../model/Connector';
import {Evse} from '../../model/Evse';
import {Session} from 'inspector';
import {Tariff} from '../../model/Tariff';
import {Token} from '../../model/Token';
import {CommandResponse} from '../../model/CommandResponse';
import {ActiveChargingProfileResult} from '../../model/ActiveChargingProfileResult';
import {ActiveChargingProfile} from '../../model/ActiveChargingProfile';
import {LocationReferences} from '../../model/LocationReferences';
import {AuthorizationInfo} from '../../model/AuthorizationInfo';
import {FromToOffsetLimitQuery} from './schema/from.to.offset.limit.query.schema';
import {Cdr} from '../../model/Cdr';
import {GlobalExceptionHandler} from './exceptions/global.exception.handler';
import {
  ConnectionIdEvseUidLocationIdVersionIdParam
} from './schema/connection.id.evse.uid.location.id.version.id.param.schema';
import {LocationIdEvseUidVersionIdParam} from './schema/location.id.evse.uid.version.id.param.schema';
import {UidVersionIdParam} from './schema/uid.version.id.param.schema';
import {VersionIdParam} from './schema/version.id.param.schema';
import {LocationIdVersionIdParam} from './schema/location.id.version.id.param.schema';
import {TokenTypeVersionIdParam} from './schema/token.type.version.id.param.schema';
import {TokenUidVersionIdParam} from './schema/token.uid.version.param.schema';
import {CommandVersionIdParam} from './schema/command.version.id.param.schema';
import {SessionIdVersionIdParam} from './schema/session.id.version.id.param.schema';

/**
 * Server API for the transaction module.
 */
export class EverythingElseApi extends AbstractModuleApi<OcpiModule> {
  /**
   * Constructor for the class.
   *
   * @param {TransactionModule} ocpiModule - The transaction module.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - Optional logger.
   */
  constructor(
    ocpiModule: OcpiModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(ocpiModule, server, logger);

    this.initFastifyExceptionHandler(new GlobalExceptionHandler(this._logger));
  }

  // ======================== CDRs ========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/cdrs/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    undefined,
    OcpiResponse<Cdr[]>, // todo proper pageable object
  )
  async getCdrPageFromDataOwner(
    _request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Cdr[]>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/cdrs',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    undefined,
    OcpiResponse<Cdr[]>, // todo proper pageable object?
  )
  async getCdrsFromDataOwner(
    _request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Cdr[]>> {
    return new Promise(() => {}); // TODO
  }

  // ======================== Locations ========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID/:evseUID/:connectorID',
    HttpMethod.Get,
    undefined,
    undefined,
    ConnectionIdEvseUidLocationIdVersionIdParam,
    undefined,
    OcpiResponse<Connector>,
  )
  async getConnectorObjectFromDataOwner(
    _request: FastifyRequest<{
      Params: ConnectionIdEvseUidLocationIdVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Connector>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID/:evseUID',
    HttpMethod.Get,
    undefined,
    undefined,
    LocationIdEvseUidVersionIdParam,
    undefined,
    OcpiResponse<Evse>,
  )
  async getEvseObjectFromDataOwner(
    _request: FastifyRequest<{
      Params: LocationIdEvseUidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Evse>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    undefined,
    OcpiResponse<Location[]>, // todo pageable
  )
  async getLocationListFromDataOwner(
    _request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Location[]>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID',
    HttpMethod.Get,
    undefined,
    undefined,
    LocationIdVersionIdParam,
    undefined,
    OcpiResponse<Location>,
  )
  async getLocationObjectFromDataOwner(
    _request: FastifyRequest<{
      Params: LocationIdVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Location>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    undefined,
    OcpiResponse<Location[]>, // todo pageable
  )
  async getLocationPageFromDataOwner(
    _request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Location[]>> {
    return new Promise(() => {}); // TODO
  }

  // ======================== Sessions ========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/sessions',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    undefined,
    OcpiResponse<Session[]>, // todo pageable?
  )
  async getSessionsFromDataOwner(
    _request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Session[]>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/sessions/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    undefined,
    OcpiResponse<Session[]>, // todo pageable?
  )
  async getSessionsPageFromDataOwner(
    _request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Session[]>> {
    return new Promise(() => {}); // TODO
  }

  // ======================== Tariffs ===========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tariffs',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    undefined,
    OcpiResponse<Tariff[]>, // todo pageable?
  )
  async getTariffsFromDataOwner(
    _request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Tariff[]>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tariffs/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    undefined,
    OcpiResponse<Tariff[]>, // todo pageable?
  )
  async getTariffsPageFromDataOwner(
    _request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Tariff[]>> {
    return new Promise(() => {}); // TODO
  }

  // ======================== Tokens ===========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tokens',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    undefined,
    OcpiResponse<Token[]>, // todo pageable?
  )
  async getTokensFromDataOwner(
    _request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Token[]>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tokens/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    undefined,
    OcpiResponse<Token[]>, // todo pageable?
  )
  async getTokensPageFromDataOwner(
    _request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Token[]>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tokens/:tokenUID/authorize',
    HttpMethod.Post,
    TokenTypeVersionIdParam,
    LocationReferences,
    TokenUidVersionIdParam,
    undefined,
    OcpiResponse<AuthorizationInfo>, // todo pageable?
  )
  async postRealTimeTokenAuthorization(
    _request: FastifyRequest<{
      Body: LocationReferences;
      Params: TokenUidVersionIdParam;
      Querystring: TokenTypeVersionIdParam;
    }>,
  ): Promise<OcpiResponse<AuthorizationInfo>> {
    return new Promise(() => {}); // TODO
  }

  // ======================== Commands ===========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/commands/:command/:uid',
    HttpMethod.Post,
    undefined,
    CommandResponse,
    CommandVersionIdParam,
    undefined,
    OcpiResponse<void>, // todo pageable?
  )
  async postAsyncResponse(
    _request: FastifyRequest<{
      Body: CommandResponse;
      Params: CommandVersionIdParam;
    }>,
  ): Promise<OcpiResponse<void>> {
    return new Promise(() => {}); // TODO
  }

  // ======================== Charging Profiles ===========================
  @AsOcpiEndpoint(
    '/ocpi/:versionId/sender/chargingprofiles/result/:uid',
    HttpMethod.Post,
    undefined,
    ActiveChargingProfileResult,
    UidVersionIdParam,
    undefined,
    OcpiResponse<void>, // todo pageable?
  )
  async postGenericChargingProfileResult(
    _request: FastifyRequest<{
      Body: ActiveChargingProfileResult;
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<void>> {
    return new Promise(() => {}); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/:versionId/sender/chargingprofiles/:sessionId',
    HttpMethod.Put,
    undefined,
    ActiveChargingProfile,
    SessionIdVersionIdParam,
    undefined,
    OcpiResponse<void>, // todo pageable?
  )
  async putSenderChargingProfile(
    _request: FastifyRequest<{
      Body: ActiveChargingProfile;
      Params: SessionIdVersionIdParam;
    }>,
  ): Promise<OcpiResponse<void>> {
    return new Promise(() => {}); // TODO
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace | string): string {
    return super._toDataPath(input, 'other');
  }
}
