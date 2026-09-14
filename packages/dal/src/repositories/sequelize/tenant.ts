// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Op } from 'sequelize';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import type { ITenantRepository } from '../repositories.js';
import { Tenant } from '../../models/tenant.js';

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

  async readByWebsocketServerPath(path: string): Promise<Tenant | undefined> {
    const tenant = await Tenant.findOne({ where: { tenantWebsocketServerPath: path } });
    return tenant ?? undefined;
  }

  async readAllWithWebsocketServerPath(): Promise<Tenant[]> {
    return await Tenant.findAll({
      where: { tenantWebsocketServerPath: { [Op.ne]: null } },
    });
  }

  async updateWebsocketServerPath(
    tenantId: number,
    path: string | null,
  ): Promise<Tenant | undefined> {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return undefined;
    }
    tenant.tenantWebsocketServerPath = path;
    return await tenant.save();
  }
}

export default SequelizeTenantRepository;
