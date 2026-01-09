// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository } from './Base.js';
import type { ITenantRepository } from '../../../interfaces/index.js';
import type { BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Tenant } from '../model/Tenant.js';

export class SequelizeTenantRepository
  extends SequelizeRepository<Tenant>
  implements ITenantRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Tenant.MODEL_NAME, logger, sequelizeInstance);
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
