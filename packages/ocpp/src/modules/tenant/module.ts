// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type OcppModuleDependencies, AbstractModule } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type { ITenantRepository } from '@citrineos/dal';

export interface TenantModuleDependencies extends OcppModuleDependencies {
  tenantRepository: ITenantRepository;
}

export class TenantModule extends AbstractModule {
  protected _tenantRepository: ITenantRepository;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
    tenantRepository,
  }: TenantModuleDependencies) {
    super(config, cache, handler, sender, EventGroup.Tenant, ocppSender, logger, ocppValidator);
    this._tenantRepository = tenantRepository;
  }

  get tenantRepository(): ITenantRepository {
    return this._tenantRepository;
  }
}

export default TenantModule;
