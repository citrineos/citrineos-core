// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AbstractModuleApi,
  AsDataEndpoint,
  HttpMethod,
  Namespace,
  OCPP1_6_Namespace,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
import { TenantModule } from './module.js';
import type { ITenantModuleApi } from './interface.js';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Tenant, CreateTenantQuerySchema } from '@citrineos/data';
/**
 * Server API for the Tenant module.
 */
export class TenantDataApi extends AbstractModuleApi<TenantModule> implements ITenantModuleApi {
  /**
   *
   * Constructs a new instance of the class.
   *
   * @param {TenantModule} tenantModule - The Tenant module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(tenantModule: TenantModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
    super(tenantModule, server, null, logger);
  }

  @AsDataEndpoint(Namespace.Tenant, HttpMethod.Post, undefined, CreateTenantQuerySchema)
  async createTenant(
    request: FastifyRequest<{
      Body: Tenant;
    }>,
  ): Promise<Tenant> {
    return await this._module.tenantRepository.createTenant(request.body);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = this._module.config.modules.tenant.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
