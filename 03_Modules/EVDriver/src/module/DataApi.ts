// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IEVDriverModuleApi } from './interface.js';
import { EVDriverModule } from './module.js';
import type { AuthorizationCreate } from '@citrineos/base';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  AuthorizationCreateSchema,
  DEFAULT_TENANT_ID,
  HttpMethod,
  Namespace,
  OCPP1_6_Namespace,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
import type { Authorization, ChargingStationKeyQuerystring } from '@citrineos/data';
import {
  ChargingStationKeyQuerySchema,
  LocalListAuthorization,
  LocalListVersion,
} from '@citrineos/data';
import { z } from 'zod/v4';

// JSON-schema form of the Authorization create payload, for Fastify body
// validation + Swagger (the repo registers JSON schemas, not raw zod).
const AuthorizationCreateJsonSchema = z.toJSONSchema(AuthorizationCreateSchema, {
  target: 'openapi-3.0',
});

export class EVDriverDataApi
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
  constructor(evDriverModule: EVDriverModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
    super(evDriverModule, server, null, logger);
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.LocalListVersion,
    HttpMethod.Get,
    ChargingStationKeyQuerySchema,
  )
  async getLocalAuthorizationListVersion(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<LocalListVersion | undefined> {
    const tenantId = request.query.tenantId;
    return await this._module.localAuthListRepository.readOnlyOneByQuery(tenantId, {
      where: {
        tenantId: tenantId,
        stationId: request.query.stationId,
      },
      include: [LocalListAuthorization],
    });
  }

  /**
   * Kabisa: upsert an Authorization (token) — status + per-token station scope.
   * Lets our backend sync a tag's block state and `allowedChargingStations` into
   * the core. Keyed by (tenantId, idToken, idTokenType).
   */
  @AsDataEndpoint(
    Namespace.AuthorizationData,
    HttpMethod.Put,
    undefined,
    AuthorizationCreateJsonSchema,
  )
  async putAuthorization(
    request: FastifyRequest<{ Body: AuthorizationCreate }>,
  ): Promise<Authorization> {
    const tenantId = request.body.tenantId ?? DEFAULT_TENANT_ID;
    return this._module.authorizeRepository.createOrUpdateByIdToken(tenantId, request.body);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
