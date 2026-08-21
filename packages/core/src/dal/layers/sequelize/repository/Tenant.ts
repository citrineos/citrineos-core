// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import type { ITenantRepository } from '../../../interfaces/repositories.js';
import { Tenant } from '../model/Tenant.js';

export class SequelizeTenantRepository
  extends SequelizeRepository<Tenant>
  implements ITenantRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Tenant.MODEL_NAME, logger, sequelizeInstance });
  }

  /**
   * A tenant is the scope rather than something inside one, so it is read by its own key. Narrowing
   * by tenantId as every other model does would query a column Tenants does not have.
   */
  override async readByKey(_tenantId: number, key: string | number): Promise<Tenant | undefined> {
    return (await Tenant.findByPk(key)) ?? undefined;
  }

  override async existsByKey(_tenantId: number, key: string): Promise<boolean> {
    return (await Tenant.findByPk(key)) !== null;
  }

  async createTenant(tenant: Tenant): Promise<Tenant> {
    const newTenant = Tenant.build({
      name: tenant.name,
      isUserTenant: tenant.isUserTenant,
      url: tenant.url,
    } as any); // bypass TS for tenant creation attributes
    return await newTenant.save();
  }
}

export default SequelizeTenantRepository;
