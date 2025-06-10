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
  HttpMethod,
  Namespace,
  OCPP1_6_Namespace,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
import {
  ChargingStationKeyQuerySchema,
  ChargingStationKeyQuerystring,
  LocalListVersion,
} from '@citrineos/data';

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
      tenantId: tenantId,
      stationId: request.query.stationId,
    });
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
