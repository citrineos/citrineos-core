// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { CallAction, OcppModuleDependencies } from '@citrineos/base';
import { AbstractModule, EventGroup } from '@citrineos/base';
import type { ITenantRepository } from '@dal/interfaces/repositories.js';

export interface TenantModuleDependencies extends OcppModuleDependencies {
  tenantRepository: ITenantRepository;
}

export class TenantModule extends AbstractModule {
  /**
   * Fields
   */
  _requests: CallAction[] = [];
  _responses: CallAction[] = [];
  protected _tenantRepository: ITenantRepository;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    tenantRepository,
  }: TenantModuleDependencies) {
    super(config, cache, handler, sender, EventGroup.Tenant, logger, ocppValidator);
    this._requests = config.modules.tenant.requests;
    this._responses = config.modules.tenant.responses;
    this._tenantRepository = tenantRepository;
  }

  get tenantRepository(): ITenantRepository {
    return this._tenantRepository;
  }
}

export default TenantModule;
