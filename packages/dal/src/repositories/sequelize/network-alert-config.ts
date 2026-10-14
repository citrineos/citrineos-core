// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type NetworkAlertConfigDto, NetworkAlertConfigSchema } from '@citrineos/types';
import { NetworkAlertConfig } from '../../models/network-alert/index.js';
import type { INetworkAlertConfigRepository } from '../repositories.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';

export class SequelizeNetworkAlertConfigRepository
  extends SequelizeRepository<NetworkAlertConfig>
  implements INetworkAlertConfigRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: NetworkAlertConfig.MODEL_NAME, logger, sequelizeInstance });
  }

  async readByTenant(tenantId: number): Promise<NetworkAlertConfigDto[]> {
    const rows = await NetworkAlertConfig.findAll({ where: { tenantId } });
    return rows.map((row) => NetworkAlertConfigSchema.parse(row.get({ plain: true })));
  }
}
