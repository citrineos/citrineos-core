// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { ITenantRepository } from '../../../interfaces';
import { BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { Tenant } from '../model/Tenant';

export class SequelizeTenantRepository
  extends SequelizeRepository<Tenant>
  implements ITenantRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Tenant.MODEL_NAME, logger, sequelizeInstance);
  }
}
