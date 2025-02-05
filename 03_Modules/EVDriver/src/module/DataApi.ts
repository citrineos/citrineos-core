// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IEVDriverModuleApi } from './interface';
import { EVDriverModule } from './module';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  AuthorizationDataSchema,
  HttpMethod,
  OCPP2_0_1_Namespace,
  OCPP2_0_1,
  OCPP1_6_Namespace,
  Namespace,
} from '@citrineos/base';
import {
  Authorization,
  AuthorizationQuerySchema,
  AuthorizationQuerystring,
  AuthorizationRestrictions,
  AuthorizationRestrictionsSchema,
  ChargingStationKeyQuerySchema,
  ChargingStationKeyQuerystring,
  LocalListVersion,
} from '@citrineos/data';

/**
 * Server API for the provisioning component.
 */
export class EVDriverModuleApi
  extends AbstractModuleApi<EVDriverModule>
  implements IEVDriverModuleApi
{
  /**
   * Constructs a new instance of the class.
   *
   * @param {EVDriverModule} evDriverModule - The EVDriver module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger for logging.
   */
  constructor(
    evDriverModule: EVDriverModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(evDriverModule, server, logger);
  }

  /**
   * Data Endpoint Methods
   */

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.AuthorizationData,
    HttpMethod.Put,
    AuthorizationQuerySchema,
    AuthorizationDataSchema,
  )
  putAuthorization(
    request: FastifyRequest<{
      Body: OCPP2_0_1.AuthorizationData;
      Querystring: AuthorizationQuerystring;
    }>,
  ): Promise<Authorization | undefined> {
    return this._module.authorizeRepository.createOrUpdateByQuerystring(
      request.body,
      request.query,
    );
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.AuthorizationRestrictions,
    HttpMethod.Put,
    AuthorizationQuerySchema,
    AuthorizationRestrictionsSchema,
  )
  putAuthorizationRestrictions(
    request: FastifyRequest<{
      Body: AuthorizationRestrictions;
      Querystring: AuthorizationQuerystring;
    }>,
  ): Promise<Authorization[]> {
    return this._module.authorizeRepository.updateRestrictionsByQuerystring(
      request.body,
      request.query,
    );
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.AuthorizationData,
    HttpMethod.Get,
    AuthorizationQuerySchema,
  )
  getAuthorization(
    request: FastifyRequest<{ Querystring: AuthorizationQuerystring }>,
  ): Promise<Authorization[]> {
    return this._module.authorizeRepository.readAllByQuerystring(request.query);
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.AuthorizationData,
    HttpMethod.Delete,
    AuthorizationQuerySchema,
  )
  async deleteAuthorization(
    request: FastifyRequest<{ Querystring: AuthorizationQuerystring }>,
  ): Promise<string> {
    return this._module.authorizeRepository
      .deleteAllByQuerystring(request.query)
      .then(
        (deletedCount) =>
          deletedCount.toString() +
          ' rows successfully deleted from ' +
          OCPP2_0_1_Namespace.AuthorizationData,
      );
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.LocalListVersion,
    HttpMethod.Get,
    ChargingStationKeyQuerySchema,
  )
  async getLocalAuthorizationListVersion(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<LocalListVersion | undefined> {
    return await this._module.localAuthListRepository.readOnlyOneByQuery({
      stationId: request.query.stationId,
    });
  }

  /**
   * Overrides superclass method to generate the URL path based on the input ({@link OCPP2_0_1_Namespace},
   * {@link OCPP1_6_Namespace} or {@link Namespace}) and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}, {@link OCPP1_6_Namespace} or {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(
    input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace,
  ): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
