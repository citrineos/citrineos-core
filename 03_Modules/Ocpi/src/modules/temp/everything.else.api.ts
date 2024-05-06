// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import { OcpiModule } from './module';
import {
  AbstractModuleApi,
  HttpMethod,
  HttpStatus,
  Namespace,
  OcpiResponse,
  OcpiTag,
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { AsOcpiEndpoint } from '../../util/as.ocpi.endpoint';
import { Connector } from '../../model/Connector';
import { Evse } from '../../model/Evse';
import { Session } from 'inspector';
import { Tariff } from '../../model/Tariff';
import { Token } from '../../model/Token';
import { CommandResponse } from '../../model/CommandResponse';
import { ActiveChargingProfileResult } from '../../model/ActiveChargingProfileResult';
import { ActiveChargingProfile } from '../../model/ActiveChargingProfile';
import { LocationReferences } from '../../model/LocationReferences';
import { AuthorizationInfo } from '../../model/AuthorizationInfo';
import { FromToOffsetLimitQuery } from './schema/from.to.offset.limit.query.schema';
import { Cdr } from '../../model/Cdr';
import { ConnectionIdEvseUidLocationIdVersionIdParam } from './schema/connection.id.evse.uid.location.id.version.id.param.schema';
import { LocationIdEvseUidVersionIdParam } from './schema/location.id.evse.uid.version.id.param.schema';
import { UidVersionIdParam } from './schema/uid.version.id.param.schema';
import { VersionIdParam } from './schema/version.id.param.schema';
import { LocationIdVersionIdParam } from './schema/location.id.version.id.param.schema';
import { TokenTypeVersionIdParam } from './schema/token.type.version.id.param.schema';
import { TokenUidVersionIdParam } from './schema/token.uid.version.param.schema';
import { CommandVersionIdParam } from './schema/command.version.id.param.schema';
import { SessionIdVersionIdParam } from './schema/session.id.version.id.param.schema';
import { GlobalExceptionHandler } from './exceptions/global.exception.handler';
import { AuthorizationHeaderSchema } from './schema/authorization.header.schema';

/**
 * Server API for the transaction module.
 */
export class EverythingElseApi extends AbstractModuleApi<OcpiModule> {
  genericResponse: OcpiResponse<any> = OcpiResponse.build(HttpStatus.OK);

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

    // todo do we need handler.handle.bind(this)? we may if we want to reference this class context in the handler
    this._server.setErrorHandler(
      new GlobalExceptionHandler(this._logger).handle,
    );
  }

  // ======================== CDRs ========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/cdrs/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Cdr[]>, // todo proper pageable object
    OcpiTag.Cdrs,
  )
  async getCdrPageFromDataOwner(
    request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Cdr[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/cdrs',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Cdr[]>, // todo proper pageable object?
    OcpiTag.Cdrs,
  )
  async getCdrsFromDataOwner(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Cdr[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  // ======================== Locations ========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID/:evseUID/:connectorID',
    HttpMethod.Get,
    undefined,
    undefined,
    ConnectionIdEvseUidLocationIdVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Connector>,
    OcpiTag.Locations,
  )
  async getConnectorObjectFromDataOwner(
    request: FastifyRequest<{
      Params: ConnectionIdEvseUidLocationIdVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Connector>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID/:evseUID',
    HttpMethod.Get,
    undefined,
    undefined,
    LocationIdEvseUidVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Evse>,
    OcpiTag.Locations,
  )
  async getEvseObjectFromDataOwner(
    request: FastifyRequest<{
      Params: LocationIdEvseUidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Evse>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Location[]>, // todo pageable
    OcpiTag.Locations,
  )
  async getLocationListFromDataOwner(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Location[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID',
    HttpMethod.Get,
    undefined,
    undefined,
    LocationIdVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Location>,
    OcpiTag.Locations,
  )
  async getLocationObjectFromDataOwner(
    request: FastifyRequest<{
      Params: LocationIdVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Location>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/locations/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Location[]>, // todo pageable
    OcpiTag.Locations,
  )
  async getLocationPageFromDataOwner(
    request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Location[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  // ======================== Sessions ========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/sessions',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Session[]>, // todo pageable?
    OcpiTag.Sessions,
  )
  async getSessionsFromDataOwner(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Session[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/sessions/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Session[]>, // todo pageable?
    OcpiTag.Sessions,
  )
  async getSessionsPageFromDataOwner(
    request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Session[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  // ======================== Tariffs ===========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tariffs',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Tariff[]>, // todo pageable?
    OcpiTag.Tariffs,
  )
  async getTariffsFromDataOwner(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Tariff[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tariffs/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Tariff[]>, // todo pageable?
    OcpiTag.Tariffs,
  )
  async getTariffsPageFromDataOwner(
    request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Tariff[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  // ======================== Tokens ===========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tokens',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Token[]>, // todo pageable?
    OcpiTag.Tokens,
  )
  async getTokensFromDataOwner(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Querystring: FromToOffsetLimitQuery;
    }>,
  ): Promise<OcpiResponse<Token[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tokens/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<Token[]>, // todo pageable?
    OcpiTag.Tokens,
  )
  async getTokensPageFromDataOwner(
    request: FastifyRequest<{
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<Token[]>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/tokens/:tokenUID/authorize',
    HttpMethod.Post,
    TokenTypeVersionIdParam,
    LocationReferences,
    TokenUidVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<AuthorizationInfo>, // todo pageable?
    OcpiTag.Tokens,
  )
  async postRealTimeTokenAuthorization(
    request: FastifyRequest<{
      Body: LocationReferences;
      Params: TokenUidVersionIdParam;
      Querystring: TokenTypeVersionIdParam;
    }>,
  ): Promise<OcpiResponse<AuthorizationInfo>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  // ======================== Commands ===========================
  @AsOcpiEndpoint(
    '/ocpi/sender/:versionId/commands/:command/:uid',
    HttpMethod.Post,
    undefined,
    CommandResponse,
    CommandVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<void>, // todo pageable?
    OcpiTag.Commands,
  )
  async postAsyncResponse(
    request: FastifyRequest<{
      Body: CommandResponse;
      Params: CommandVersionIdParam;
    }>,
  ): Promise<OcpiResponse<void>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  // ======================== Charging Profiles ===========================
  @AsOcpiEndpoint(
    '/ocpi/:versionId/sender/chargingprofiles/result/:uid',
    HttpMethod.Post,
    undefined,
    ActiveChargingProfileResult,
    UidVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<void>, // todo pageable?
    OcpiTag.ChargingProfiles,
  )
  async postGenericChargingProfileResult(
    request: FastifyRequest<{
      Body: ActiveChargingProfileResult;
      Params: UidVersionIdParam;
    }>,
  ): Promise<OcpiResponse<void>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
  }

  @AsOcpiEndpoint(
    '/ocpi/:versionId/sender/chargingprofiles/:sessionId',
    HttpMethod.Put,
    undefined,
    ActiveChargingProfile,
    SessionIdVersionIdParam,
    AuthorizationHeaderSchema,
    OcpiResponse<void>, // todo pageable?
    OcpiTag.ChargingProfiles,
  )
  async putSenderChargingProfile(
    request: FastifyRequest<{
      Body: ActiveChargingProfile;
      Params: SessionIdVersionIdParam;
    }>,
  ): Promise<OcpiResponse<void>> {
    console.log('todo', request);
    return new Promise((resolve) => {
      resolve(this.genericResponse);
    }); // TODO
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
