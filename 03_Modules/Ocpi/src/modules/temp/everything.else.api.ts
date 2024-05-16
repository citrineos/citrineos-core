// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {ILogObj, Logger} from 'tslog';
import {OcpiModule} from './module';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  HttpMethod,
  HttpStatus,
  Namespace,
} from '@citrineos/base';
import {FastifyInstance, FastifyRequest} from 'fastify';
import {Connector} from '../../model/Connector';
import {Evse} from '../../model/Evse';
import {Session} from 'inspector';
import {Tariff} from '../../model/Tariff';
import {Token} from '../../model/Token';
import {LocationReferences} from '../../model/LocationReferences';
import {AuthorizationInfo} from '../../model/AuthorizationInfo';
import {FromToOffsetLimitQuery} from './schema/from.to.offset.limit.query.schema';
import {Cdr} from '../../model/Cdr';
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
import {OldGlobalExceptionHandler} from './exceptions/oldGlobalExceptionHandler';
import {AuthorizationHeader} from './schema/authorizationHeader';
import {buildOcpiResponse, OcpiResponse} from '../../util/ocpi.response';
import {OcpiTag} from '../../util/ocpi.tag';
import {CommandResult} from "../../model/CommandResponse";

/**
 * Server API for the transaction module.
 */
export class EverythingElseApi extends AbstractModuleApi<OcpiModule> {
  genericResponse: OcpiResponse<any> = buildOcpiResponse(HttpStatus.OK);

  /**
   * Util for the class.
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
      new OldGlobalExceptionHandler(this._logger).handle,
    );
  }

  // ======================== Locations ========================
  @AsDataEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID/:evseUID/:connectorID',
    HttpMethod.Get,
    undefined,
    undefined,
    ConnectionIdEvseUidLocationIdVersionIdParam,
    AuthorizationHeader,
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

  @AsDataEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID/:evseUID',
    HttpMethod.Get,
    undefined,
    undefined,
    LocationIdEvseUidVersionIdParam,
    AuthorizationHeader,
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

  @AsDataEndpoint(
    '/ocpi/sender/:versionId/locations',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    AuthorizationHeader,
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

  @AsDataEndpoint(
    '/ocpi/sender/:versionId/locations/:locationID',
    HttpMethod.Get,
    undefined,
    undefined,
    LocationIdVersionIdParam,
    AuthorizationHeader,
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

  @AsDataEndpoint(
    '/ocpi/sender/:versionId/locations/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    AuthorizationHeader,
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
  @AsDataEndpoint(
    '/ocpi/sender/:versionId/sessions',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    AuthorizationHeader,
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

  @AsDataEndpoint(
    '/ocpi/sender/:versionId/sessions/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    AuthorizationHeader,
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

  // ======================== Tokens ===========================
  @AsDataEndpoint(
    '/ocpi/sender/:versionId/tokens',
    HttpMethod.Get,
    FromToOffsetLimitQuery,
    undefined,
    VersionIdParam,
    AuthorizationHeader,
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

  @AsDataEndpoint(
    '/ocpi/sender/:versionId/tokens/page/:uid',
    HttpMethod.Get,
    undefined,
    undefined,
    UidVersionIdParam,
    AuthorizationHeader,
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

  @AsDataEndpoint(
    '/ocpi/sender/:versionId/tokens/:tokenUID/authorize',
    HttpMethod.Post,
    TokenTypeVersionIdParam,
    LocationReferences,
    TokenUidVersionIdParam,
    AuthorizationHeader,
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
  @AsDataEndpoint(
    '/ocpi/sender/:versionId/commands/:command/:uid',
    HttpMethod.Post,
    undefined,
    CommandResult,
    CommandVersionIdParam,
    AuthorizationHeader,
    OcpiResponse<void>, // todo pageable?
    OcpiTag.Commands,
  )
  async postAsyncResponse(
    request: FastifyRequest<{
      Body: CommandResult;
      Params: CommandVersionIdParam;
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
