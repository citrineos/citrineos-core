// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Op } from 'sequelize';
import type { IChargingStationNetworkProfileRepository } from '../repositories.js';
import { ChargingStationNetworkProfile } from '../../models/location/charging-station-network-profile.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';

export class SequelizeChargingStationNetworkProfileRepository
  extends SequelizeRepository<ChargingStationNetworkProfile>
  implements IChargingStationNetworkProfileRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({
      config,
      namespace: ChargingStationNetworkProfile.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
  }

  async deleteAllByStationIdAndConfigurationSlots(
    tenantId: number,
    ocppConnectionName: string,
    configurationSlot: number[],
  ): Promise<ChargingStationNetworkProfile[]> {
    return this.deleteAllByQuery(tenantId, {
      where: {
        ocppConnectionName,
        tenantId,
        configurationSlot: { [Op.in]: configurationSlot },
      },
    });
  }
}

export default SequelizeChargingStationNetworkProfileRepository;
