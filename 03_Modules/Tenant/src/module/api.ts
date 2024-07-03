// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractModuleApi, CallAction, Namespace } from '@citrineos/base';
import { TenantModule } from './module';
import { ITenantModuleApi } from './interface';
import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';

/**
 * Server API for the Tenant module.
 */
export class TenantModuleApi
  extends AbstractModuleApi<TenantModule>
  implements ITenantModuleApi {
  /**
   *
   * Constructs a new instance of the class.
   *
   * @param {TenantModule} tenantModule - The Tenant module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(
    tenantModule: TenantModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(tenantModule, server, logger);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.tenant.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix = this._module.config.modules.tenant.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
